using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManager.API.Models
{
    // --- Project Model ---
    public class Project
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 3)]
        public string Title { get; set; }

        [StringLength(500)]
        public string Description { get; set; }

        public DateTime CreationDate { get; set; } = DateTime.UtcNow;

        // Foreign Key to User (Ensures only the owner can access it)
        public string UserId { get; set; }
        
        [ForeignKey("UserId")]
        public User User { get; set; }

        // Navigation property to hold the tasks belonging to this project
        public ICollection<Task> Tasks { get; set; } = new List<Task>();
    }

    // --- Task Model ---
    public class Task
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }

        public DateTime? DueDate { get; set; } // The '?' makes the DateTime optional

        public bool CompletionStatus { get; set; } = false;

        // Foreign Key to Project (Reference to its parent project)
        public int ProjectId { get; set; }
        
        [ForeignKey("ProjectId")]
        public Project Project { get; set; }
    }
}
