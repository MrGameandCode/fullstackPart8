import { useState, useEffect } from "react";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import LoginForm from "./components/LoginForm";
import Recommended from "./components/Recommended";
import { useApolloClient } from "@apollo/client";

const App = () => {
  const [page, setPage] = useState("authors");
  const [token, setToken] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const client = useApolloClient();

  const Notify = ({ errorMessage }) => {
    if (!errorMessage) {
      return null;
    }
    return <div style={{ color: "red" }}>{errorMessage}</div>;
  };

  const notify = (message) => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage(null);
    }, 10000);
  };

  const logout = () => {
    setToken(null);
    localStorage.clear();
    client.resetStore();
  };

  const renderActions = () => {
    if (!token) {
      return <button onClick={() => setPage("login")}>Login</button>;
    } else {
      return (
        <>
          <button onClick={() => setPage("add")}>add book</button>
          <button onClick={() => setPage("recommended")}>recommended</button>
          <button onClick={() => logout()}>Logout</button>
        </>
      );
    }
  };

  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem("library-user-token");
    if (loggedUserJSON) {
      setToken(loggedUserJSON);
    }
  }, [page]);

  return (
    <div>
      <Notify errorMessage={errorMessage} />
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>
        {renderActions()}
      </div>

      <Authors show={page === "authors"} token={token}/>

      <Books show={page === "books"} />

      <NewBook show={page === "add"} token={token}/>

      <Recommended show={page === "recommended"} token={token}/>

      <LoginForm
        show={page === "login"}
        setToken={setToken}
        setError={notify}
        token={token}
      />
    </div>
  );
};

export default App;
