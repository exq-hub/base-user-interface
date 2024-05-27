# exq-ui
User Interface for Exquisitor.

Routes:

* /index: Split-Screen with Chat and User Relevance Feedback (In progress)
* /chat: Chat only (Not Implemented)
* /urf: URF only (Not Implemented)
* /urf-multi: URF with multiple models (Not Implemented)


## Setup
To install the application
```
npm clean-install
```

## Run
To run the application
```
npm run dev
```

Currently uses mock data by default, which is set in src/services/ExqusitorAPI.ts `mock=true`.
