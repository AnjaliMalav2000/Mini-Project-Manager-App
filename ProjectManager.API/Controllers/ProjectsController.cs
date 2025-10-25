using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations; 
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManager.API.Data;
using ProjectManager.API.Models;

namespace ProjectManager.API.Controllers
{
    [Authorize] // Enforces JWT validation for all actions in this controller
    [Route("api/[controller]")]
    [ApiController]
    public class ProjectsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProjectsController(AppDbContext context)
        {
            _context = context;
        }

        // Helper to get the logged-in User's ID from the JWT token
        private string GetUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        // DTOs for input and output
        public class ProjectCreateDto
        {
            [Required]
            [StringLength(100, MinimumLength = 3)]
            public string Title { get; set; }
            [StringLength(500)]
            public string Description { get; set; }
        }

        public class TaskCreateDto
        {
            [Required]
            public string Title { get; set; }
            public DateTime? DueDate { get; set; }
        }

        public class TaskUpdateDto
        {
            [Required]
            public string Title { get; set; }
            public DateTime? DueDate { get; set; }
            public bool CompletionStatus { get; set; }
        }

        // --- Project Endpoints ---

        // GET: /api/projects
        [HttpGet]
        public async Task<IActionResult> GetProjects()
        {
            var userId = GetUserId();
            var projects = await _context.Projects
                .Where(p => p.UserId == userId) // SECURITY: Filter by logged-in User ID
                .Select(p => new {
                    p.Id,
                    p.Title,
                    p.Description,
                    p.CreationDate,
                    TaskCount = p.Tasks.Count,
                    CompletedTasks = p.Tasks.Count(t => t.CompletionStatus),
                    IncompleteTasks = p.Tasks.Count(t => !t.CompletionStatus)
                })
                .OrderByDescending(p => p.CreationDate)
                .ToListAsync();

            return Ok(projects);
        }

        // POST: /api/projects
        [HttpPost]
        public async Task<IActionResult> CreateProject([FromBody] ProjectCreateDto projectDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var project = new Project
            {
                Title = projectDto.Title,
                Description = projectDto.Description,
                UserId = GetUserId(), // SECURITY: Assign the project to the logged-in user
                CreationDate = DateTime.UtcNow
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProject), new { id = project.Id }, new 
            {
                project.Id,
                project.Title,
                project.Description,
                project.CreationDate
            });
        }

        // GET: /api/projects/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProject(int id)
        {
            var userId = GetUserId();

            var project = await _context.Projects
                .Include(p => p.Tasks) // Include related tasks
                .Where(p => p.Id == id && p.UserId == userId) // SECURITY: Filter by Project ID AND User ID
                .FirstOrDefaultAsync();

            if (project == null)
            {
                return NotFound(new { Message = "Project not found or you do not have access." });
            }
            
            // Map to anonymous object for cleaner output
            var projectDetails = new
            {
                project.Id,
                project.Title,
                project.Description,
                project.CreationDate,
                Tasks = project.Tasks.Select(t => new {
                    t.Id,
                    t.Title,
                    t.DueDate,
                    t.CompletionStatus
                }).OrderByDescending(t => t.DueDate).ToList()
            };

            return Ok(projectDetails);
        }

        // DELETE: /api/projects/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var userId = GetUserId();

            var project = await _context.Projects
                .Where(p => p.Id == id && p.UserId == userId) // SECURITY: Filter by Project ID AND User ID
                .FirstOrDefaultAsync();

            if (project == null)
            {
                return NotFound(new { Message = "Project not found or you do not have access." });
            }

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return NoContent(); // 204 Success, no content
        }

        // --- Task Endpoints ---

        // POST: /api/projects/{projectId}/tasks
        [HttpPost("{projectId}/tasks")]
        public async Task<IActionResult> AddTask(int projectId, [FromBody] TaskCreateDto taskDto)
        {
            var userId = GetUserId();

            // 1. Validate Project existence and ownership
            var project = await _context.Projects
                .Where(p => p.Id == projectId && p.UserId == userId) // SECURITY: Check Project ID AND User ID
                .FirstOrDefaultAsync();

            if (project == null)
            {
                return NotFound(new { Message = "Project not found or you do not have access." });
            }

            // 2. Create the task
            var task = new Models.Task // Explicitly use Models.Task
            {
                Title = taskDto.Title,
                DueDate = taskDto.DueDate,
                ProjectId = projectId,
                CompletionStatus = false
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            return Created(string.Empty, new { task.Id, task.Title, task.DueDate, task.CompletionStatus });
        }

        // PUT: /api/tasks/{taskId}
        [HttpPut("/api/tasks/{taskId}")]
        public async Task<IActionResult> UpdateTask(int taskId, [FromBody] TaskUpdateDto taskDto)
        {
            var userId = GetUserId();

            // 1. Find the task and include its parent project to check ownership
            Models.Task? task = await _context.Tasks // Explicitly declare the type here
                .Include(t => t.Project)
                .Where(t => t.Id == taskId && t.Project.UserId == userId) // SECURITY: Check Task ID AND Project Owner (User ID)
                .FirstOrDefaultAsync();

            if (task == null)
            {
                return NotFound(new { Message = "Task not found or you do not have access." });
            }

            // 2. Apply updates
            task.Title = taskDto.Title;
            task.DueDate = taskDto.DueDate;
            task.CompletionStatus = taskDto.CompletionStatus;

            _context.Tasks.Update(task);
            await _context.SaveChangesAsync();

            return Ok(new { task.Id, task.Title, task.DueDate, task.CompletionStatus, task.ProjectId });
        }
        
        // DELETE: /api/tasks/{taskId}
        [HttpDelete("/api/tasks/{taskId}")]
        public async Task<IActionResult> DeleteTask(int taskId)
        {
            var userId = GetUserId();

            // 1. Find the task and include its parent project to check ownership
            Models.Task? task = await _context.Tasks // Explicitly declare the type here
                .Include(t => t.Project)
                .Where(t => t.Id == taskId && t.Project.UserId == userId) // SECURITY: Check Task ID AND Project Owner (User ID)
                .FirstOrDefaultAsync();

            if (task == null)
            {
                return NotFound(new { Message = "Task not found or you do not have access." });
            }

            // 2. Delete the task
            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
