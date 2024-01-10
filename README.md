## [Soshare](https://soshare.onrender.com)

Mini social platform for sharing videos and posts within a vibrant community. This application is built with [react](https://react.dev/). The main aim of building the project is to understand how video rendering and twitter commenting works. Currently this project uses http progressive streaming and a chronological commenting.

- Frontend state management is handled by [redux](https://redux.js.org/).
- [Material ui](https://mui.com) handles theming, user interface and responsiveness.
- [Axios](https://www.npmjs.com/package/axios) handles data fetching.
- Authentication is based on [JWT](https://jwt.io) and stored in cookies.
- [cookie-parser](https://www.npmjs.com/package/cookie-parser) handles cookie authentication and storage is controlled by the server.
- [Socket.io](https://socket.io) handles real time communication.
- Progressive streaming and storage is achieved through [firebase](https://firebase.google.com/).

### Features
- Notification system
- Comment system
- Soshare Pen (Compose Box)
- Carousel Slides
- Cursor Pagination
- Like/Unlike System
- Real time notification and update

### Upcoming Development
- Adaptive bitrate streaming
- Improved carousel experience
- Improved Soshare Pen; I want it to be like twitter compose box.

## FrontEnd Development

### Frontend Technologies (Most Relevant)
- React
- Material ui
- Axios
- Firbase
- React-dropzone
- React-multi-carousel
- Socket.io-client
- React-redux
- Moment

### Getting Started - Commands 

**Development**
- cd client
- npm install
- npm run dev
- Open browser at speciifed url. Most likely [http://localhost:3000](http://localhost:3000)

**Production**
- npm run build
  

## Backend Development

### Backend Technologies (Most Relevant)
- Nodejs
- Express
- Firebase
- jWT
- Multer
- Nodemailer
- Node-cron
- Socket.io
- Cookie-parser

### Database and Hosting
- MongoDB
- Mongoose
- Render


### Getting Started - Commands

**Development**
- npm run dev


## Issues & Concerns
- Browser Lags a bit overtime due to http progressive streaming limitation (Most likely after 30 media views)
- I want to make soshare pen more like twitter compose box with the @mentions and link e.t.c
- Code refactoring and tidy up


## Contributions
Please note this project is just for learning. Feel free to fork and create pull request.
