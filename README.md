# StudySpace

A mobile-first spaced repetition app built with React and Vite.

## Features
- Dashboard and subject overview
- Flashcard library with search and subject filters
- Create and edit basic, definition, image and image-label cards
- Upload images and tap to position image-label markers
- Revision sessions with Again / Hard / Good / Easy ratings
- Basic adaptive review intervals
- Statistics and review performance
- IndexedDB storage (cards and images stay on this device)
- PWA manifest and basic service worker for installation/offline app shell

## Run locally
1. Install Node.js (LTS).
2. Open this folder in a terminal.
3. Run `npm install`
4. Run `npm run dev`
5. Open the local URL shown in the terminal.

## Optional cloud sync with Supabase
StudySpace works without an account, storing cards in the browser. To sync cards automatically across phones and computers:

1. Create a Supabase project.
2. In its SQL Editor, run the contents of `supabase/schema.sql`.
3. Copy `.env.example` to `.env` and add the project URL and public publishable key from Supabase.
4. For Vercel, add the same two variables in **Project Settings → Environment Variables**, then redeploy.
5. In StudySpace, tap the cloud icon and create an account. Every card change will then sync to Supabase.

The production configuration is already supplied in `.env.production`. For a hosted deployment, also add these variables in the host's environment settings so they remain explicit and easy to manage.

Never put a Supabase `service_role` key in the app. The public publishable (or anon) key is the correct browser key; the row-level security policies in the supplied schema keep each account's cards private.

## Publish with GitHub + Vercel
1. Create a new GitHub repository.
2. Upload all files in this project (the contents of this folder, not the ZIP itself).
3. In Vercel, choose **Add New → Project** and import the GitHub repository.
4. Vercel should detect Vite automatically.
5. Use build command `npm run build` and output directory `dist`.
6. Deploy.

Every push to the connected GitHub branch will trigger a new Vercel deployment.

## Install on iPhone
1. Open the deployed HTTPS website in Safari.
2. Tap Share.
3. Choose Add to Home Screen.
4. Tap Add.

## Important limitations
- Without signing in, cards are stored in IndexedDB on the current browser/device. Clearing website data can remove them, so use a downloaded backup or configure Supabase sync.
- The scheduling is a simple starter algorithm, not a full FSRS implementation.
- For reliable offline use, test the deployed PWA on the target devices. The service worker caches the app shell and runtime GET requests.
- Image labels can be positioned by tapping the uploaded image. The current review screen shows the label names rather than hiding/revealing each marker individually; that can be expanded in a later iteration.
