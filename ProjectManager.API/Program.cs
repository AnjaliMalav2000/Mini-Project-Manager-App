using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProjectManager.API.Data;
using ProjectManager.API.Models;
using System.Text;
using Newtonsoft.Json;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure the Database Connection (Uses the "DefaultConnection" from appsettings.json)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));


// 2. Configure Identity (User and Password manager)
builder.Services.AddIdentity<User, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>() // Tells Identity to use our AppDbContext for storage
    .AddDefaultTokenProviders();

// 3. Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.ASCII.GetBytes(jwtSettings["Secret"]);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Set to true in production
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

// Configure CORS (Allows the React frontend to talk to the C# backend)
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy",
        policy =>
        {
            // Allow requests from the React/Vite development port
            policy.WithOrigins("http://localhost:5173", "http://localhost:3000") 
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

// Fix circular references when returning Project/Tasks (Crucial for the ProjectDetails endpoint)
builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
    });

// 4. Build and Run the application
var app = builder.Build();

// Use the CORS policy (Must be before UseAuthentication/UseAuthorization)
app.UseCors("CorsPolicy");

// Enable Authentication and Authorization (Apply security rules)
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();