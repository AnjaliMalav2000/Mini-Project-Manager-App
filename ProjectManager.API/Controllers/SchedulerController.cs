using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks; // Added to prevent ambiguity with Task type
using System.ComponentModel.DataAnnotations; // Added for DTO validation
using System.Collections; // Added for robustness, though Queue<T> is in Generic

namespace ProjectManager.API.Controllers
{
    // --- Data Transfer Objects (DTOs) ---

    /// <summary>
    /// DTO representing an individual task submission in the scheduling request.
    /// </summary>
    public class SchedulerTaskInput
    {
        /// <summary>
        /// The unique title or name of the task. Used as the node key in the graph.
        /// </summary>
        [Required]
        public string Title { get; set; }

        /// <summary>
        /// The estimated time required to complete the task, in hours.
        /// </summary>
        [Required]
        [Range(1, 1000)] // Estimated hours must be realistic
        public int EstimatedHours { get; set; }

        /// <summary>
        /// The target completion date for the task. Nullable.
        /// </summary>
        public DateTime? DueDate { get; set; }
        
        /// <summary>
        /// A list of task titles that this task depends on.
        /// </summary>
        public List<string> Dependencies { get; set; } = new List<string>();
    }

    /// <summary>
    /// DTO for the entire POST request body to the schedule endpoint.
    /// </summary>
    public class ScheduleRequestDto
    {
        /// <summary>
        /// The list of all tasks to be scheduled.
        /// </summary>
        public List<SchedulerTaskInput> Tasks { get; set; } = new List<SchedulerTaskInput>();
    }

    /// <summary>
    /// DTO for the API response body, containing the sorted schedule.
    /// </summary>
    public class ScheduleResponseDto
    {
        /// <summary>
        /// The ordered list of task titles, representing the recommended schedule.
        /// </summary>
        public List<string> RecommendedOrder { get; set; } = new List<string>();
    }

    // --- Controller Definition ---

    // Ensures only authenticated users with a valid JWT can access this controller.
    [Authorize]
    [ApiController]
    [Route("api/v1/projects/{projectId}/schedule")]
    public class SchedulerController : ControllerBase
    {
        /// <summary>
        /// Processes a list of tasks and their dependencies to generate a logically ordered work schedule.
        /// </summary>
        /// <param name="projectId">The ID of the project (part of the route, not used in the core algorithm).</param>
        /// <param name="requestDto">The list of tasks and their dependencies.</param>
        /// <returns>A schedule of recommended task execution order or an error if a cycle exists.</returns>
        [HttpPost]
        public ActionResult<ScheduleResponseDto> ScheduleTasks(
            [FromRoute] Guid projectId,
            [FromBody] ScheduleRequestDto requestDto)
        {
            // 1. Initial Validation
            if (requestDto?.Tasks == null || !requestDto.Tasks.Any())
            {
                return BadRequest(new { Error = "Input tasks list cannot be empty." });
            }

            // Use a HashSet for O(1) lookup of all available task titles.
            var allTaskTitles = requestDto.Tasks.Select(t => t.Title).ToHashSet();

            // 2. Data Structure Initialization for Topological Sort (Kahn's Algorithm)

            // Adjacency List: Maps a task (predecessor) to the tasks that depend on it (successors).
            // A -> [B, C] means B and C depend on A, so A must come first.
            var graph = new Dictionary<string, List<string>>();

            // In-Degree: Maps a task to the count of remaining tasks it depends on.
            var inDegree = new Dictionary<string, int>();

            // Initialize all tasks in the graph and in-degree maps
            foreach (var task in requestDto.Tasks)
            {
                graph[task.Title] = new List<string>();
                inDegree[task.Title] = 0;
            }

            // 3. Graph Construction: Populate adjacency list and in-degrees
            foreach (var task in requestDto.Tasks)
            {
                // Task.Title is the dependent task (successor)
                // DependencyTitle is the task that must be completed first (predecessor)
                foreach (var dependencyTitle in task.Dependencies)
                {
                    // Error check: Ensure the dependency task exists in the input list
                    if (!allTaskTitles.Contains(dependencyTitle))
                    {
                        return BadRequest(new { Error = $"Task '{task.Title}' depends on unknown task '{dependencyTitle}'." });
                    }

                    // Add the edge: Predecessor (dependency) -> Successor (current task)
                    graph[dependencyTitle].Add(task.Title);

                    // Increment the in-degree of the current task (it has one more incoming edge)
                    // We check if the key exists because of potential duplicate dependencies in input (though not standard)
                    if (inDegree.ContainsKey(task.Title))
                    {
                        inDegree[task.Title]++;
                    }
                }
            }

            // 4. Topological Sort (Kahn's Algorithm)
            // Initialize the queue with all tasks that have no dependencies (in-degree == 0).
            var queue = new Queue<string>(inDegree.Where(pair => pair.Value == 0).Select(pair => pair.Key));
            var recommendedOrder = new List<string>();
            int tasksProcessed = 0;

            while (queue.Any())
            {
                var currentTaskTitle = queue.Dequeue();
                recommendedOrder.Add(currentTaskTitle);
                tasksProcessed++;

                // Process all successor tasks (tasks that depend on the current one)
                if (graph.TryGetValue(currentTaskTitle, out var dependents))
                {
                    foreach (var dependentTaskTitle in dependents)
                    {
                        // Decrement the in-degree of the dependent task
                        inDegree[dependentTaskTitle]--;

                        // If the dependent task has no remaining dependencies, it's ready to be scheduled
                        if (inDegree[dependentTaskTitle] == 0)
                        {
                            queue.Enqueue(dependentTaskTitle);
                        }
                    }
                }
            }

            // 5. Cycle Detection
            if (tasksProcessed != requestDto.Tasks.Count)
            {
                // If the number of processed tasks is less than the total, a cycle exists (e.g., A depends on B, B depends on A).
                return BadRequest(new { Error = "Dependency cycle detected. Cannot generate a complete schedule." });
            }

            // 6. Output Logic
            var response = new ScheduleResponseDto
            {
                RecommendedOrder = recommendedOrder
            };

            return Ok(response);
        }
    }
}
