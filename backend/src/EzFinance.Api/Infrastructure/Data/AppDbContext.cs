using EzFinance.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace EzFinance.Api.Infrastructure.Data;

/// <summary>
/// EF Core context for the Supabase Postgres database. The schema is owned by the SQL
/// migrations in backend/supabase/migrations; EF only maps to it (snake_case names).
/// </summary>
public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<BankAccount> BankAccounts => Set<BankAccount>();
    public DbSet<RecurringBill> RecurringBills => Set<RecurringBill>();
    public DbSet<Loan> Loans => Set<Loan>();
    public DbSet<Transfer> Transfers => Set<Transfer>();
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<GoalContribution> GoalContributions => Set<GoalContribution>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<BudgetEnvelope> BudgetEnvelopes => Set<BudgetEnvelope>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Profile>().ToTable("profiles");
        modelBuilder.Entity<Transaction>(t =>
        {
            t.ToTable("transactions");
            t.Property(x => x.Id).ValueGeneratedNever();
            t.Property(x => x.Amount).HasPrecision(14, 2);
        });
        modelBuilder.Entity<BankAccount>(a =>
        {
            a.ToTable("bank_accounts");
            a.Property(x => x.Id).ValueGeneratedNever();
            a.Property(x => x.OpeningBalance).HasPrecision(16, 2);
        });
        modelBuilder.Entity<RecurringBill>(b =>
        {
            b.ToTable("recurring_bills");
            b.Property(x => x.Id).ValueGeneratedNever();
            b.Property(x => x.Amount).HasPrecision(14, 2);
        });
        modelBuilder.Entity<Loan>(l =>
        {
            l.ToTable("loans");
            l.Property(x => x.Id).ValueGeneratedNever();
            l.Property(x => x.TotalAmount).HasPrecision(16, 2);
            l.Property(x => x.Remaining).HasPrecision(16, 2);
            l.Property(x => x.InterestRate).HasPrecision(5, 2);
            l.Property(x => x.Emi).HasPrecision(14, 2);
        });
        modelBuilder.Entity<Transfer>(t =>
        {
            t.ToTable("transfers");
            t.Property(x => x.Id).ValueGeneratedNever();
            t.Property(x => x.Amount).HasPrecision(14, 2);
        });
        modelBuilder.Entity<Goal>(g =>
        {
            g.ToTable("goals");
            g.Property(x => x.Id).ValueGeneratedNever();
            g.Property(x => x.Target).HasPrecision(16, 2);
        });
        modelBuilder.Entity<GoalContribution>(c =>
        {
            c.ToTable("goal_contributions");
            c.Property(x => x.Id).ValueGeneratedNever();
            c.Property(x => x.Amount).HasPrecision(16, 2);
        });
        modelBuilder.Entity<Budget>(b =>
        {
            b.ToTable("budgets");
            b.HasKey(x => x.UserId);
            b.Property(x => x.UserId).ValueGeneratedNever();
            b.Property(x => x.MonthlyLimit).HasPrecision(16, 2);
        });
        modelBuilder.Entity<BudgetEnvelope>(e =>
        {
            e.ToTable("budget_envelopes");
            e.Property(x => x.Id).ValueGeneratedNever();
            e.Property(x => x.MonthlyLimit).HasPrecision(16, 2);
        });
    }
}
