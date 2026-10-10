using EzFinance.Api.Infrastructure.Auth;
using EzFinance.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EzFinance.Api.Controllers;

/// <summary>Shared helpers for the signed-in user's data endpoints (bills, loans, transfers).</summary>
[ApiController]
[Authorize]
public abstract class UserDataController(AppDbContext db) : ControllerBase
{
    protected AppDbContext Db { get; } = db;

    protected Guid UserId => User.GetUserId();

    /// <summary>True when the account is one of the caller's live (not removed) accounts.</summary>
    protected Task<bool> IsLiveAccountAsync(Guid? accountId, CancellationToken ct)
    {
        var userId = UserId;
        return accountId is null
            ? Task.FromResult(false)
            : Db.BankAccounts.AnyAsync(a => a.Id == accountId && a.UserId == userId && a.DeletedAt == null, ct);
    }

    /// <summary>Dates can't be in the future (one day of slack for time zones ahead of UTC).</summary>
    protected static bool IsFuture(DateOnly date) => date > DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1);

    protected ObjectResult Fail(int status, string code, string detail)
    {
        var problem = ProblemDetailsFactory.CreateProblemDetails(HttpContext, status, detail: detail);
        problem.Extensions["code"] = code;
        return new ObjectResult(problem) { StatusCode = status };
    }

    protected ObjectResult InvalidAccount() =>
        Fail(StatusCodes.Status400BadRequest, "invalid_account", "Pick one of your linked bank accounts.");
}
