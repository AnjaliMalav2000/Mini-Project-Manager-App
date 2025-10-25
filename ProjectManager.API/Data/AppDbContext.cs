using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ProjectManager.API.Models;

namespace ProjectManager.API.Data
{
    // Inherit from IdentityDbContext<User> to include all Identity/Auth tables
    public class AppDbContext : IdentityDbContext<User>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // These properties represent the tables in our database
        public DbSet<Project> Projects { get; set; }
        public DbSet<Models.Task> Tasks { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Must call the base method for Identity tables to be created
            base.OnModelCreating(modelBuilder);

            // Configure cascading delete behavior:
            // When a Project is deleted, all associated Tasks should also be deleted.
            modelBuilder.Entity<Models.Task>()
                .HasOne(t => t.Project)
                .WithMany(p => p.Tasks)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // When a User is deleted, set their Projects' UserId to null (optional, 
            // but helpful if you wanted to keep projects, though typically you'd cascade delete here too).
            // For this minimal setup, we often let the cascading rule on Identity tables handle it,
            // but defining the relationship explicitly is safer.
            modelBuilder.Entity<Project>()
                .HasOne(p => p.User)
                .WithMany(u => u.Projects)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade); // When user is deleted, their projects are deleted.
        }
    }
}
