import { QueryResult } from "pg";

interface IMovieRequest {
  name: string;
  description?: string;
  duration: number;
  price: number;
}

interface IMovie extends IMovieRequest {
  id: number;
}

type MovieQueryResult = QueryResult<IMovie>;

export { IMovieRequest, IMovie, MovieQueryResult };
