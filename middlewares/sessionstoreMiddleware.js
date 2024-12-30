// Middleware to track the current page
app.use((req, res, next) => {
    if (req.session) {
      // Store the current page URL in the session
      req.session.currentPage = req.originalUrl;
    }
    next();
  });
