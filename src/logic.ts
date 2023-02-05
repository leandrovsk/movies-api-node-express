import { Request, Response } from "express";
import { QueryConfig } from "pg";
import format from "pg-format";
import { client } from "./database";
import { IMovie, IMovieRequest, MovieQueryResult } from "./interfaces";

const createMovie = async (request: Request, response: Response): Promise<Response> => {
  const orderDataRequest: IMovieRequest = request.body;

  const queryString: string = format(
    `INSERT INTO
        movies(%I)
      VALUES
        (%L)
      RETURNING *;
    `,
    Object.keys(orderDataRequest),
    Object.values(orderDataRequest)
  );

  try {
    const queryResult: MovieQueryResult = await client.query(queryString);
    const newMovie: IMovie = queryResult.rows[0];

    return response.status(201).json(newMovie);
  } catch (error) {
    return response.status(409).json({
      message: "Movie already exists.",
    });
  }
};

const getMovies = async (request: Request, response: Response): Promise<Response> => {
  let page = request.query.page === undefined ? 1 : Number(request.query.page);
  let per_page = request.query.per_page === undefined ? 5 : Number(request.query.per_page);
  let order = request.query.order === undefined ? "ASC" : request.query.order.toString().toUpperCase();
  let sort = request.query.sort === undefined ? "id" : request.query.sort;

  let offset: number = 0;
  let offsetNextPage: number | null = 0;
  let offsetPreviousPage: number | null = 0;

  let limit = 5;

  if (per_page) {
    if (per_page >= 1 && per_page <= 5) {
      limit = per_page;
    }
  } else {
    per_page = 5;
  }

  if (page && page >= 1) {
    offset = (page - 1) * per_page;

    offsetNextPage = offset + per_page;

    if (page >= 2) {
      offsetPreviousPage = offset - per_page;
    }
  }

  if (order !== "ASC" && order !== "DESC") {
    order = "ASC";
  }

  if (sort) {
    if (sort !== "price" && sort !== "duration") {
      sort = "id";
    }
  }

  const queryString: string = `
    SELECT
    * 
    FROM
      movies 
    ORDER BY ${sort} ${order}
    LIMIT $1 OFFSET $2;
  `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [limit, offset],
  };

  const queryConfigNext: QueryConfig = {
    text: queryString,
    values: [limit, offsetNextPage],
  };

  const queryConfigPrevious: QueryConfig = {
    text: queryString,
    values: [limit, offsetPreviousPage],
  };

  try {
    const queryResult: MovieQueryResult = await client.query(queryConfig);

    const queryResultNext: MovieQueryResult = await client.query(queryConfigNext);

    const queryResultPrevious: MovieQueryResult = await client.query(queryConfigPrevious);

    const nextPage: number | null = page < 1 ? 2 : queryResultNext.rowCount === 0 ? null : page + 1;

    const previousPage: number | null = page <= 1 ? null : queryResultPrevious.rowCount === 0 ? null : page - 1;

    const newResult = {
      previousPage: previousPage === null ? null : `http://localhost:3000/movies?page=${previousPage}&per_page=${per_page}`,
      nextPage: nextPage === null ? null : `http://localhost:3000/movies?page=${nextPage}&per_page=${per_page}`,
      count: queryResult.rowCount,
      data: queryResult.rows,
    };

    return response.status(200).json(newResult);
  } catch (error) {
    console.log(error);
    return response.status(503).json({
      message: "Service unavailable",
    });
  }
};

const updateMovie = async (request: Request, response: Response): Promise<Response> => {
  if (request.body.id) {
    return response.status(400).json({
      message: "cannot update identity column",
    });
  }

  const id: number = parseInt(request.params.id);
  const movieValues = Object.values(request.body);
  const movieKeys = Object.keys(request.body);

  const queryString: string = format(
    `
    UPDATE
      movies
    SET(%I) = ROW(%L)
    WHERE
      id=$1
    RETURNING *;
    `,
    movieKeys,
    movieValues
  );

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [id],
  };

  try {
    const queryResult: MovieQueryResult = await client.query(queryConfig);
    return response.status(200).json(queryResult.rows[0]);
  } catch (error) {
    return response.status(409).json({
      message: "Movie already exists.",
    });
  }
};
const deleteMovie = async (request: Request, response: Response): Promise<Response> => {
  const id: number = parseInt(request.params.id);

  const queryString: string = `
    DELETE FROM
      movies
    WHERE
      id = $1;
  `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [id],
  };

  await client.query(queryConfig);

  return response.status(204).json();
};

export { createMovie, getMovies, deleteMovie, updateMovie };
