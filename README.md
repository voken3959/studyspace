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
- This first version stores cards in IndexedDB on the current browser/device. It does not yet have user accounts or cloud sync.
- Clearing website data can remove locally stored cards. Export/backup and cloud sync should be added before relying on it for important study material.
- The scheduling is a simple starter algorithm, not a full FSRS implementation.
- For reliable offline use, test the deployed PWA on the target devices. The service worker caches the app shell and runtime GET requests.
- Image labels can be positioned by tapping the uploaded image. The current review screen shows the label names rather than hiding/revealing each marker individually; that can be expanded in a later iteration.
