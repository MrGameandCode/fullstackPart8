import { useQuery, useMutation } from "@apollo/client";
import { ALL_AUTHORS, UPDATE_AUTHOR } from "../queries";
import { useState } from "react";

const Authors = (props) => {
  const result = useQuery(ALL_AUTHORS);
  const [name, setName] = useState("");
  const [born, setBorn] = useState("");

  const [updateAuthor] = useMutation(UPDATE_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
  });

  if (!props.show) {
    return null;
  }

  if (result.loading) {
    return <div>loading...</div>;
  }

  const submit = async (event) => {
    event.preventDefault();

    console.log("update author...");
    updateAuthor({ variables: { name, born } });

    setName("");
    setBorn("");
  };

  const authors = result.data.allAuthors;

  if (authors) {
    return (
      <div>
        <h2>authors</h2>
        <table>
          <tbody>
            <tr>
              <th></th>
              <th>born</th>
              <th>books</th>
            </tr>
            {authors.map((a) => (
              <tr key={a.name}>
                <td>{a.name}</td>
                <td>{a.born}</td>
                <td>{a.bookCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2>Set birthyear</h2>
        <form onSubmit={submit}>
          <div>
            name
            <input
              value={name}
              onChange={({ target }) => setName(target.value)}
            />
          </div>
          <div>
            born
            <input
              type="number"
              value={born}
              onChange={({ target }) => setBorn(parseInt(target.value))}
            />
          </div>
          <button type="submit">update author</button>
        </form>
      </div>
    );
  }
};

export default Authors;
