using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;

namespace ProjectManager.API.Models
{
    // Inheriting from IdentityUser gives us built-in fields like Id, UserName, and Email.
    public class User : IdentityUser
    {
        // Navigation property to hold the projects owned by this user
        public ICollection<Project> Projects { get; set; } = new List<Project>();
    }
}
