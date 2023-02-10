import { gql } from "@apollo/client";

export const ALL_AUTHORS = gql`
  query AllAuthors {
    allAuthors {
      name
      id
      born
      bookCount
    }
  }
`;
export const ALL_BOOKS = gql`
  query AllAuthors {
    allBooks {
      title
      published
      id
      genres
      author {
        bookCount
        born
        id
        name
      }
    }
  }
`;
