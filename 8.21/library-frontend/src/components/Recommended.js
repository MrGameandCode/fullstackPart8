import { useQuery } from "@apollo/client";
import { MY_RECOMMENDED_BOOKS } from "../queries";

const Recommended = (props) => {
  const result = useQuery(MY_RECOMMENDED_BOOKS);

  if (!props.show) {
    return null;
  }

  if (result.loading) {
    return <div>loading...</div>;
  }

  const books = result.data.myRecommendedBooks;

  console.log(books)

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
      </div>
    );
  }
};

export default Recommended;
