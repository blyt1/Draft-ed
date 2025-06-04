import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  username: string;
  email: string;
  hashed_password: string;
  created_at?: Date;
}

export interface Beer {
  _id?: ObjectId;
  name: string;
  brewery: string;
  type: string;
  abv?: number;
  ibu?: number;
  description?: string;
  image_url?: string;
  created_at?: Date;
}

export interface UserBeer {
  beer_id: ObjectId;
  elo_score: number;
  comparisons: number;
  created_at?: Date;
}

export interface BeerList {
  _id?: ObjectId;
  user_id: ObjectId;
  name: string;
  beers: UserBeer[];
  created_at?: Date;
}

// Request/Response schemas
export interface UserCreate {
  username: string;
  email: string;
  password: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface BeerCreate {
  name: string;
  brewery: string;
  type: string;
  abv?: number;
  ibu?: number;
  description?: string;
  image_url?: string;
}

export interface ComparisonRequest {
  beer1_id: string;
  beer2_id: string;
  winner_id: string;
  list_name: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  _id: string;
  username: string;
  email: string;
  created_at: Date;
}

export interface BeerResponse {
  _id: string;
  name: string;
  brewery: string;
  type: string;
  abv?: number;
  ibu?: number;
  description?: string;
  image_url?: string;
  created_at: Date;
}

export interface UserBeerResponse {
  beer_id: string;
  elo_score: number;
  comparisons: number;
  created_at: Date;
}

export interface BeerListResponse {
  _id: string;
  user_id: string;
  name: string;
  beers: UserBeerResponse[];
  created_at: Date;
} 