using System.Net.WebSockets;
using System.Security.Claims;
using System.Text.Json;
using EzFinance.Api.Infrastructure.Auth;

namespace EzFinance.Api.Infrastructure.Sync;

/// <summary>
/// GET /api/sync (WebSocket, Bearer token): sends <c>{"type":"changed","tables":[...]}</c> whenever
/// the signed-in user's data changes, from any device. The app reloads on each message.
/// The socket closes when the access token expires; the app reconnects with a fresh one.
/// </summary>
public static class SyncSocketEndpoint
{
    public static IEndpointConventionBuilder MapSyncSocket(this IEndpointRouteBuilder app) =>
        app.Map("/api/sync", HandleAsync).RequireAuthorization();

    private static async Task HandleAsync(HttpContext http, ChangeFeed feed)
    {
        if (!http.WebSockets.IsWebSocketRequest)
        {
            http.Response.StatusCode = StatusCodes.Status400BadRequest;
            return;
        }

        var userId = http.User.GetUserId();
        using var subscription = feed.Subscribe(userId);
        using var socket = await http.WebSockets.AcceptWebSocketAsync();
        using var stop = CancellationTokenSource.CreateLinkedTokenSource(http.RequestAborted);

        if (long.TryParse(http.User.FindFirstValue("exp"), out var exp))
        {
            var left = DateTimeOffset.FromUnixTimeSeconds(exp) - DateTimeOffset.UtcNow;
            stop.CancelAfter(left > TimeSpan.Zero ? left : TimeSpan.Zero);
        }

        var receiving = WaitForCloseAsync(socket, stop);
        try
        {
            await foreach (var tables in subscription.Reader.ReadAllAsync(stop.Token))
            {
                var message = JsonSerializer.SerializeToUtf8Bytes(new { type = "changed", tables });
                await socket.SendAsync(message, WebSocketMessageType.Text, endOfMessage: true, stop.Token);
            }
        }
        catch (Exception ex) when (ex is OperationCanceledException or WebSocketException)
        {
            // Client went away, or the token expired.
        }

        if (socket.State is WebSocketState.Open or WebSocketState.CloseReceived)
        {
            try
            {
                await socket.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, null, CancellationToken.None);
            }
            catch (WebSocketException)
            {
            }
        }
        await receiving;
    }

    /// <summary>The app never sends data; this only notices when it closes the socket.</summary>
    private static async Task WaitForCloseAsync(WebSocket socket, CancellationTokenSource stop)
    {
        var buffer = new byte[256];
        try
        {
            while (!stop.IsCancellationRequested)
            {
                var result = await socket.ReceiveAsync(buffer, stop.Token);
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    break;
                }
            }
        }
        catch (Exception ex) when (ex is OperationCanceledException or WebSocketException)
        {
        }
        finally
        {
            stop.Cancel();
        }
    }
}
