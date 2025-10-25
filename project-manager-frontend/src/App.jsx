import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, Link } from 'react-router-dom';

// --- CONFIGURATION ---
const API_BASE_URL = 'https://localhost:7001/api';

// --- CONTEXT ---
const AuthContext = createContext(null);

const useAuth = () => {
  return useContext(AuthContext);
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);

  // Set up Axios interceptor to automatically attach JWT to requests
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // In a real app, you'd decode the token to get the username/claims
      // For this app, we'll assume the user is logged in if the token exists
      if (!user) {
        // Simple placeholder user for UI, as we only store token/username on login
        setUser({ username: localStorage.getItem('username') });
      }
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
  }, [token]);

  const login = (token, username) => {
    localStorage.setItem('jwtToken', token);
    localStorage.setItem('username', username);
    setToken(token);
    setUser({ username });
    // Note: The Axios interceptor above handles setting the header
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('username');
    setToken(null);
    setUser(null);
  };

  const value = { user, token, login, logout, isAuthenticated: !!token };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- AUTH PAGES ---

const AuthForm = ({ isRegister }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isRegister && (!username || !email || !password)) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }
    if (!isRegister && (!username || !password)) {
      setError('Username and password are required.');
      setLoading(false);
      return;
    }

    const endpoint = isRegister ? 'register' : 'login';
    const payload = isRegister ? { username, email, password } : { username, password };

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/${endpoint}`, payload);

      if (response.status === 200 && !isRegister) {
        // Successful Login
        login(response.data.token, response.data.username);
        navigate('/dashboard');
      } else if (response.status === 200 && isRegister) {
        // Successful Registration
        navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.Message || err.message || 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-2xl rounded-lg border border-gray-200">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isRegister ? 'Create Your Account' : 'Sign In to Manager'}
        </h2>
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            {error}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            {isRegister && (
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm mt-3"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}
            <div className={isRegister ? 'mt-3' : ''}>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${isRegister ? 'rounded-b-md' : 'rounded-md'}`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : isRegister ? 'Register' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          {isRegister ? (
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign In
              </Link>
            </p>
          ) : (
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Register
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// --- PRIVATE ROUTE COMPONENT ---
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// --- DASHBOARD (PROJECT LIST) ---

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/projects`);
      setProjects(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please refresh.');
      if (err.response && err.response.status === 401) {
        logout(); // Log out if token is expired/invalid
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project and all its tasks?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/projects/${id}`);
      fetchProjects(); // Refresh the list
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project.');
    }
  };

  const handleCreate = () => {
    setShowForm(true);
  };

  if (loading) return <div className="text-center mt-12 text-gray-500">Loading Dashboard...</div>;
  if (error) return <div className="text-center mt-12 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="flex justify-between items-center mb-8 pb-4 border-b">
        <h1 className="text-3xl font-bold text-gray-800">
          Hello, {user?.username || 'User'}!
        </h1>
        <nav className="flex items-center space-x-4">
          <button
            onClick={logout}
            className="text-sm font-medium text-red-600 hover:text-red-800"
          >
            Logout
          </button>
        </nav>
      </header>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Your Projects ({projects.length})</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-md hover:bg-indigo-700 transition"
        >
          + Create New Project
        </button>
      </div>

      {showForm && (
        <ProjectForm 
          onSuccess={() => { setShowForm(false); fetchProjects(); }} 
          onCancel={() => setShowForm(false)} 
        />
      )}

      {projects.length === 0 && !showForm ? (
        <div className="text-center py-16 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg mt-8">
          <p>You haven't created any projects yet.</p>
          <button
            onClick={handleCreate}
            className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Start your first project now.
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <div
              key={project.id}
              className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 hover:shadow-xl transition duration-300 flex flex-col"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
                {project.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4 flex-grow">
                {project.description || 'No description provided.'}
              </p>
              <div className="text-xs text-gray-500 mb-3">
                Created: {new Date(project.creationDate).toLocaleDateString()}
              </div>
              
              <div className="mb-4">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  project.incompleteTasks > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {project.incompleteTasks} Incomplete
                </span>
                <span className="ml-2 px-3 py-1 text-sm font-semibold rounded-full bg-gray-200 text-gray-800">
                  {project.completedTasks} Completed
                </span>
                <span className="ml-2 px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                  Total: {project.taskCount}
                </span>
              </div>

              <div className="mt-auto flex justify-between items-center pt-3 border-t">
                <Link
                  to={`/projects/${project.id}`}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition"
                >
                  View Details
                </Link>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="text-red-500 hover:text-red-700 text-sm p-1 rounded transition"
                  title="Delete Project"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- PROJECT DETAIL PAGE ---

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const navigate = useNavigate();

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/projects/${id}`);
      setProject(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching project details:', err);
      setError('Failed to load project details.');
      // navigate('/dashboard'); // Optionally redirect on failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/tasks/${taskId}`);
      fetchProjectDetails(); // Refresh the list
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task.');
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const updatedTask = {
        title: task.title,
        dueDate: task.dueDate,
        completionStatus: !task.completionStatus,
      };
      await axios.put(`${API_BASE_URL}/tasks/${task.id}`, updatedTask);
      fetchProjectDetails(); // Refresh the list
    } catch (err) {
      console.error('Error toggling task status:', err);
      setError('Failed to update task status.');
    }
  };

  if (loading) return <div className="text-center mt-12 text-gray-500">Loading Project Details...</div>;
  if (error) return <div className="text-center mt-12 text-red-500">Error: {error}</div>;
  if (!project) return <div className="text-center mt-12 text-gray-500">Project not found.</div>;

  const incompleteTasks = project.tasks.filter(t => !t.completionStatus).length;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium mb-6 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </Link>

        <header className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
          <p className="text-gray-600 mb-4">{project.description}</p>
          <div className="text-sm text-gray-500">
            Created: {new Date(project.creationDate).toLocaleDateString()}
          </div>
          <div className="mt-4">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
              incompleteTasks > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
            }`}>
              {incompleteTasks} Tasks Remaining
            </span>
          </div>
        </header>

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg mb-6" role="alert">
            {error}
          </div>
        )}

        {/* Task Management Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-700">Tasks</h3>
            <button
              onClick={() => setShowTaskForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-md hover:bg-indigo-700 transition"
            >
              + Add New Task
            </button>
          </div>

          {showTaskForm && (
            <TaskForm 
              projectId={project.id} 
              onSuccess={() => { setShowTaskForm(false); fetchProjectDetails(); }} 
              onCancel={() => setShowTaskForm(false)} 
            />
          )}

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {project.tasks.length === 0 ? (
                <li className="p-6 text-gray-500 text-center">No tasks added yet.</li>
              ) : (
                project.tasks.map(task => (
                  <li key={task.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                    <div className="flex items-center flex-grow">
                      <input
                        id={`task-${task.id}`}
                        name={`task-${task.id}`}
                        type="checkbox"
                        checked={task.completionStatus}
                        onChange={() => handleToggleComplete(task)}
                        className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <label
                        htmlFor={`task-${task.id}`}
                        className={`ml-3 text-lg font-medium ${task.completionStatus ? 'line-through text-gray-500' : 'text-gray-900'}`}
                      >
                        {task.title}
                      </label>
                      {task.dueDate && (
                        <span className={`ml-4 px-2 py-0.5 text-xs rounded-full font-medium ${
                          task.completionStatus ? 'bg-gray-200 text-gray-600' : 
                          new Date(task.dueDate) < new Date() ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleTaskDelete(task.id)}
                      className="text-red-500 hover:text-red-700 transition p-2 rounded-full"
                      title="Delete Task"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- FORMS ---

const ProjectForm = ({ onSuccess, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (title.length < 3 || title.length > 100) {
        setError('Title must be between 3 and 100 characters.');
        setLoading(false);
        return;
    }
    if (description.length > 500) {
        setError('Description cannot exceed 500 characters.');
        setLoading(false);
        return;
    }

    try {
      await axios.post(`${API_BASE_URL}/projects`, { title, description });
      onSuccess();
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.response?.data?.Message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl mb-6 border-l-4 border-indigo-500">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Create New Project</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title (3-100 characters)
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description (Optional, max 500 characters)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows="3"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        {error && <div className="text-sm text-red-500">{error}</div>}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? 'Creating...' : 'Save Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

const TaskForm = ({ projectId, onSuccess, onCancel }) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!title) {
        setError('Task title is required.');
        setLoading(false);
        return;
    }

    try {
      const payload = {
        title,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      };
      await axios.post(`${API_BASE_URL}/projects/${projectId}/tasks`, payload);
      onSuccess();
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.Message || 'Failed to create task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl mb-6 border-l-4 border-blue-500">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Add New Task</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700">
            Task Title (Required)
          </label>
          <input
            type="text"
            id="taskTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
            Due Date (Optional)
          </label>
          <input
            type="date"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {error && <div className="text-sm text-red-500">{error}</div>}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-md hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Adding...' : 'Add Task'}
          </button>
        </div>
      </form>
    </div>
  );
};


// --- MAIN APP COMPONENT ---

const App = () => {
    // Custom hook to extract the necessary hook from react-router-dom
    const useParams = () => {
        const context = useContext(ReactRouterDOM.RouteContext);
        return context ? context.params : {};
    };

    return (
        <Router>
            <AuthProvider>
                <div className="font-sans">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<AuthForm isRegister={false} />} />
                        <Route path="/register" element={<AuthForm isRegister={true} />} />

                        {/* Private Routes */}
                        <Route
                            path="/dashboard"
                            element={
                                <PrivateRoute>
                                    <Dashboard />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/projects/:id"
                            element={
                                <PrivateRoute>
                                    <ProjectDetail />
                                </PrivateRoute>
                            }
                        />

                        {/* Default Route */}
                        <Route path="*" element={<Navigate to="/dashboard" />} />
                    </Routes>
                </div>
            </AuthProvider>
        </Router>
    );
};

export default App;
