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

Currently uses mock data by default, which is set in src/services/ExquisitorAPI.ts `mock=true`.

To run with exquisitor live service from a different location than localhost:8000, change `exqURI` in src/services/ExquisitorAPI.ts to the correct address.

## Run
To run the application
```
npm run dev
```

