import { Request, Response, NextFunction, request } from "express";
import { QueryConfig } from "pg";
import { client } from "./database";
import { MovieQueryResult } from "./interfaces";

const ensureMovieExists = async (request: Request, response: Response, next: NextFunction): Promise<Response | void> => {
  const id: number = parseInt(request.params.id);

  const queryString: string = `
    SELECT
      *
    FROM
      movies
    WHERE
      id = $1;
  `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [id],
  };

  try {
    const queryResult: MovieQueryResult = await client.query(queryConfig);

    if (!queryResult.rowCount) {
      return response.status(404).json({
        message: "Movie not found.",
      });
    }

    return next();
  } catch (error) {
    return response.status(400).json({
      message: "Something went wrong!",
    });
  }
};

export { ensureMovieExists };
