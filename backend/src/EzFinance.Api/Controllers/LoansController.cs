using EzFinance.Api.Contracts;
using EzFinance.Api.Entities;
using EzFinance.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EzFinance.Api.Controllers;

/// <summary>The signed-in user's loans and debts. Another user's loan answers 404.</summary>
[Route("api/loans")]
public sealed class LoansController(AppDbContext db) : UserDataController(db)
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LoanResponse>>> List(CancellationToken ct) =>
        Ok(await Owned().Where(l => l.DeletedAt == null).OrderBy(l => l.CreatedAt)
            .AsNoTracking().Select(l => LoanResponse.From(l)).ToListAsync(ct));

    [HttpPost]
    public async Task<ActionResult<LoanResponse>> Create(CreateLoanRequest request, CancellationToken ct)
    {
        if (request.Remaining > request.TotalAmount) return RemainingProblem();
        var existing = await Db.Loans.AsNoTracking().FirstOrDefaultAsync(l => l.Id == request.Id, ct);
        if (existing is not null)
        {
            return existing.UserId == UserId
                ? Ok(LoanResponse.From(existing))
                : Fail(StatusCodes.Status409Conflict, "id_conflict", "Use a different loan id.");
        }

        var now = DateTimeOffset.UtcNow;
        var loan = new Loan { Id = request.Id!.Value, UserId = UserId, CreatedAt = now, UpdatedAt = now };
        Apply(loan, request);
        Db.Loans.Add(loan);
        await Db.SaveChangesAsync(ct);
        return Created($"/api/loans/{loan.Id}", LoanResponse.From(loan));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<LoanResponse>> Update(Guid id, UpdateLoanRequest request, CancellationToken ct)
    {
        if (request.Remaining > request.TotalAmount) return RemainingProblem();
        var loan = await Owned().FirstOrDefaultAsync(l => l.Id == id && l.DeletedAt == null, ct);
        if (loan is null) return NotFoundProblem();

        Apply(loan, request);
        loan.UpdatedAt = DateTimeOffset.UtcNow;
        await Db.SaveChangesAsync(ct);
        return Ok(LoanResponse.From(loan));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var loan = await Owned().FirstOrDefaultAsync(l => l.Id == id, ct);
        if (loan is null) return NotFoundProblem();
        if (loan.DeletedAt is null)
        {
            loan.DeletedAt = DateTimeOffset.UtcNow;
            loan.UpdatedAt = loan.DeletedAt.Value;
            await Db.SaveChangesAsync(ct);
        }
        return NoContent();
    }

    private IQueryable<Loan> Owned()
    {
        var userId = UserId;
        return Db.Loans.Where(l => l.UserId == userId);
    }

    private static void Apply(Loan loan, LoanFields f)
    {
        loan.Name = f.Name.Trim();
        loan.Lender = f.Lender?.Trim() ?? string.Empty;
        loan.TotalAmount = Math.Round(f.TotalAmount, 2);
        loan.Remaining = Math.Round(f.Remaining, 2);
        loan.InterestRate = Math.Round(f.InterestRate, 2);
        loan.Emi = Math.Round(f.Emi, 2);
        loan.DueDay = (short)f.DueDay;
        loan.RemindDaysBefore = (short)f.RemindDaysBefore;
        loan.RemindOnDue = f.RemindOnDue;
    }

    private ObjectResult RemainingProblem() =>
        Fail(StatusCodes.Status400BadRequest, "remaining_exceeds_total", "What's left to pay can't be more than the loan amount.");

    private ObjectResult NotFoundProblem() => Fail(StatusCodes.Status404NotFound, "loan_not_found", "Loan not found.");
}
