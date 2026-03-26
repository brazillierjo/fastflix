-- Migration 011: Favorite Actors
ALTER TABLE user_taste_profile ADD COLUMN favorite_actors TEXT DEFAULT '[]';
