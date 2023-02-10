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
export const ADD_BOOK = gql`
  mutation AddBook(
    $title: String!
    $published: Int!
    $author: String
    $genres: [String!]
  ) {
    addBook(
      title: $title
      published: $published
      author: $author
      genres: $genres
    ) {
      id
      genres
      published
      title
    }
  }
`;

export const UPDATE_AUTHOR = gql`
  mutation EditAuthor($name: String!, $born: Int!) {
    editAuthor(name: $name, setBornTo: $born) {
      name
      born
    }
  }
`;

export const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password)  {
      value
    }
  }
`