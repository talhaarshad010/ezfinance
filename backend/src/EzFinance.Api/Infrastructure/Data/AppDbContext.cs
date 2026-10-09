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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Profile>().ToTable("profiles");
    }
}
