using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace EzFinance.Api.Infrastructure.Sync;

/// <summary>
/// Publishes to <see cref="ChangeFeed"/> after every successful SaveChanges: one notice per user,
/// listing the tables (e.g. "transactions", "bank_accounts") whose rows were added, edited or deleted.
/// Scoped, like the DbContext it is attached to.
/// </summary>
public sealed class ChangeFeedInterceptor(ChangeFeed feed) : SaveChangesInterceptor
{
    private Dictionary<Guid, HashSet<string>>? _pending;

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        Collect(eventData.Context);
        return result;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        Collect(eventData.Context);
        return ValueTask.FromResult(result);
    }

    public override int SavedChanges(SaveChangesCompletedEventData eventData, int result)
    {
        Flush();
        return result;
    }

    public override ValueTask<int> SavedChangesAsync(
        SaveChangesCompletedEventData eventData, int result, CancellationToken cancellationToken = default)
    {
        Flush();
        return ValueTask.FromResult(result);
    }

    public override void SaveChangesFailed(DbContextErrorEventData eventData) => _pending = null;

    public override Task SaveChangesFailedAsync(DbContextErrorEventData eventData, CancellationToken cancellationToken = default)
    {
        _pending = null;
        return Task.CompletedTask;
    }

    private void Collect(DbContext? context)
    {
        if (context is null)
        {
            return;
        }
        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified or EntityState.Deleted))
            {
                continue;
            }
            var table = entry.Metadata.GetTableName();
            if (table is null || entry.Metadata.FindProperty("UserId") is null
                || entry.Property("UserId").CurrentValue is not Guid userId)
            {
                continue;
            }
            _pending ??= [];
            if (!_pending.TryGetValue(userId, out var tables))
            {
                _pending[userId] = tables = [];
            }
            tables.Add(table);
        }
    }

    private void Flush()
    {
        if (_pending is null)
        {
            return;
        }
        foreach (var (userId, tables) in _pending)
        {
            feed.Publish(userId, [.. tables]);
        }
        _pending = null;
    }
}
