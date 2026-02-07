-- Fix API Key for Demo User
-- Ensure the user exists and set the specific API Key required by the demo page

INSERT INTO users (phone, nickname, api_key)
VALUES ('13570226397', 'Demo User', 'sk-r0z3io4kastv7w271uud')
ON CONFLICT (phone) 
DO UPDATE SET api_key = 'sk-r0z3io4kastv7w271uud';
