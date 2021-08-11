import { Model } from "objection";
import express = require("express");

declare function crud(
  model: typeof Model,
  {
    includeRelations,
  }: {
    includeRelations: boolean;
  }
): express.Router;

export = crud;
