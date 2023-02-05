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

type IListRequiredKeys = "name" | "duration" | "price" | "description" | string

type MovieQueryResult = QueryResult<IMovie>;

export { IMovieRequest, IMovie, MovieQueryResult, IListRequiredKeys };
