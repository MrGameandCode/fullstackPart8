import { useQuery } from "@apollo/client";
import { useState } from "react";
import { ALL_BOOKS, ALL_GENRES } from "../queries";

const Books = (props) => {
  const [genre, setGenre] = useState("");
  const resultGenres = useQuery(ALL_GENRES);
  const result = useQuery(ALL_BOOKS, {
    variables: { genre },
    refetchQueries: [{ query: ALL_GENRES }],
  });

  if (!props.show) {
    return null;
  }

  if (result.loading || resultGenres.loading) {
    return <div>loading...</div>;
  }

  const books = result.data.allBooks;
  const allGenres = resultGenres.data.allGenres;

  if (books) {
    return (
      <div>
        <h2>books</h2>

        <table>
          <tbody>
            <tr>
              <th></th>
              <th>author</th>
              <th>published</th>
            </tr>
            {books.map((a) => (
              <tr key={a.title}>
                <td>{a.title}</td>
                <td>{a.author.name}</td>
                <td>{a.published}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>Filter by</h3>
        <button onClick={() => setGenre("")}>All Genres</button>
        {allGenres.map((a) => (
          <button key={a} value={a} onClick={() => setGenre(a)}>
            {a}
          </button>
        ))}
      </div>
    );
  }
};

export default Books;
