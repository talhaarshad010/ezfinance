using System.Collections.Concurrent;
using System.Threading.Channels;

namespace EzFinance.Api.Infrastructure.Sync;

/// <summary>
/// In-process "your data changed" feed. Every write goes through this API, so after a save the
/// API tells the user's other open devices which tables changed and they reload.
/// In memory: fine for a single API instance (a scaled-out deployment would need a shared bus).
/// </summary>
public sealed class ChangeFeed
{
    private readonly ConcurrentDictionary<Guid, ConcurrentDictionary<Guid, Channel<string[]>>> _users = new();

    public Subscription Subscribe(Guid userId)
    {
        // A slow client only needs to know "something changed", so old notices can be dropped.
        var channel = Channel.CreateBounded<string[]>(new BoundedChannelOptions(16)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
        });
        var id = Guid.NewGuid();
        _users.GetOrAdd(userId, _ => new())[id] = channel;
        return new Subscription(channel.Reader, () => Remove(userId, id));
    }

    public void Publish(Guid userId, string[] tables)
    {
        if (!_users.TryGetValue(userId, out var subscribers))
        {
            return;
        }
        foreach (var channel in subscribers.Values)
        {
            channel.Writer.TryWrite(tables);
        }
    }

    private void Remove(Guid userId, Guid id)
    {
        if (_users.TryGetValue(userId, out var subscribers) && subscribers.TryRemove(id, out _) && subscribers.IsEmpty)
        {
            _users.TryRemove(new KeyValuePair<Guid, ConcurrentDictionary<Guid, Channel<string[]>>>(userId, subscribers));
        }
    }

    public sealed class Subscription(ChannelReader<string[]> reader, Action unsubscribe) : IDisposable
    {
        public ChannelReader<string[]> Reader { get; } = reader;

        public void Dispose() => unsubscribe();
    }
}
