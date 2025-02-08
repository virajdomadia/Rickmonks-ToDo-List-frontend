import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getTodos, createTodo, updateTodo, deleteTodo } from "../api/todo";
import Navbar from "../components/Navbar";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState("");
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (user) fetchTodos();
  }, [user, filter, search, page]);

  const fetchTodos = async () => {
    try {
      const completed =
        filter === "all" ? undefined : filter === "completed" ? true : false;

      const res = await getTodos(localStorage.getItem("token"), {
        completed,
        search,
        page,
      });

      if (res.data?.todos) {
        setTodos(res.data.todos);
        setTotalPages(res.data.totalPages);
      } else {
        setTodos([]);
      }
    } catch (error) {
      console.error("Error fetching todos:", error);
      setTodos([]);
    }
  };

  const handleCreate = async () => {
    if (!task.trim()) return alert("Task cannot be empty!");

    try {
      const token = localStorage.getItem("token");
      const response = await createTodo(token, task);

      if (response.data) {
        setTodos((prev) => [...prev, response.data]); // Optimistic UI update
      }

      setTask("");
      fetchTodos();
    } catch (error) {
      console.error("Error creating todo:", error);
      alert("Failed to create task!");
    }
  };

  const handleUpdate = async (id, updatedTask, completed) => {
    try {
      const token = localStorage.getItem("token");

      // Optimistic UI update
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo._id === id ? { ...todo, task: updatedTask, completed } : todo
        )
      );

      // API request to update the backend
      const response = await updateTodo(token, id, {
        task: updatedTask,
        completed,
      });

      if (response.data) {
        setTodos((prevTodos) =>
          prevTodos.map((todo) =>
            todo._id === id ? { ...todo, ...response.data } : todo
          )
        );
      } else {
        throw new Error("Invalid API response");
      }

      setEditing(null); // Exit editing mode
    } catch (error) {
      console.error("Error updating todo:", error);

      // Revert UI change if API call fails
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo._id === id ? { ...todo, completed: !completed } : todo
        )
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTodo(localStorage.getItem("token"), id);
      setTodos((prevTodos) => prevTodos.filter((todo) => todo._id !== id));
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Welcome to My TO-DO LIST APP!
        </h1>

        <div className="mt-6 flex bg-white shadow-lg rounded-lg p-4">
          <input
            type="text"
            placeholder="New Task"
            className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400"
            value={task}
            onChange={(e) => setTask(e.target.value)}
          />
          <button
            className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            onClick={handleCreate}
          >
            Add
          </button>
        </div>

        <div className="mt-6 flex gap-4">
          <input
            type="text"
            placeholder="Search tasks..."
            className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border p-3 rounded-lg"
            onChange={(e) => setFilter(e.target.value)}
            value={filter}
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <ul className="mt-6 space-y-4">
          {todos.length > 0 ? (
            todos.map((todo) => (
              <li
                key={todo._id}
                className="bg-white shadow-md p-4 rounded-lg flex justify-between items-center"
              >
                {editing === todo._id ? (
                  <input
                    type="text"
                    className="border p-2 rounded-lg w-full"
                    defaultValue={todo.task}
                    onBlur={(e) =>
                      handleUpdate(todo._id, e.target.value, todo.completed)
                    }
                    autoFocus
                  />
                ) : (
                  <span
                    className={`text-lg ${
                      todo.completed
                        ? "line-through text-gray-500"
                        : "text-gray-800"
                    }`}
                  >
                    {todo.task}
                  </span>
                )}
                <div className="flex gap-3">
                  <button
                    className="text-blue-500 hover:text-blue-600"
                    onClick={() => setEditing(todo._id)}
                  >
                    ✏️
                  </button>
                  <button
                    className="text-green-500 hover:text-green-600"
                    onClick={() =>
                      handleUpdate(todo._id, todo.task, !todo.completed)
                    }
                  >
                    ✅
                  </button>
                  <button
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(todo._id)}
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))
          ) : (
            <p className="text-center text-gray-500">No tasks available</p>
          )}
        </ul>

        <div className="mt-6 flex justify-center gap-4">
          <button
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            onClick={() => setPage(page - 1)}
          >
            Prev
          </button>
          <span className="text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
