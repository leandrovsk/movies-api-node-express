import { Request, Response, NextFunction, request } from "express";
import { QueryConfig } from "pg";
import { client } from "./database";
import { IListRequiredKeys, MovieQueryResult } from "./interfaces";

const validateBodyMiddleware = (request: Request, response: Response, next: NextFunction): Response | void => {

  const keys: Array<string> = Object.keys(request.body)
  const values: Array<string> = Object.values(request.body)
  const requiredKeys: Array<IListRequiredKeys> = ["name", "duration", "price"]
  const requiredKeysExtra: Array<IListRequiredKeys> = ["name", "duration", "price", "description"]
  
  const validateKeys: boolean = requiredKeys.every((key:IListRequiredKeys) => keys.includes(key))
  const catchWrongKeys: boolean = keys.some((key:string) => !requiredKeysExtra.includes(key))
  const catchEmptyValues: boolean = values.some((value: string) => value === "")

  if(request.method === 'POST') {
    if(!validateKeys) {
      return response.status(400).json({
        message: `Error: required keys are ${requiredKeysExtra}`
      })
    }
  }

  if(catchWrongKeys) {
    return response.status(400).json({
      message: `Error: wrong key name`
    })
  }

  if(catchEmptyValues) {
    return response.status(400).json({
      message: "Error: empty value field"
    })
  }

  return next()
}

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

export { ensureMovieExists, validateBodyMiddleware };
