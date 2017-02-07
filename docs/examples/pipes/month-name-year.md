### Request

  ```javascript
  {
    "token": "YOUR_TOKEN_HERE",
    "config": {
    	"idPath": "tasks[].id",
   	"aggregator": {"mean": "*"},
   	"plugins": {
    "context-file-timestamp-tasks-timestamp-long": {
      "use": "similar-text-plugin",
      "inputs": ["file.created_at | month-name-of-year", "tasks[].created_at | month-name-of-year"]
    }
}
   },
   "file": {
     	"title": "february report",
    	"created_at": 1487013296
   },
   "tasks": [
     {
	    	"id": 1,
	     "title": "february meeting",
	     "created_at": 1486408496,
	  	 "due_date": 1486418496
     },
     {
	    	"id": 2,
	     "title": "january meeting",
	     "created_at": 1484334896,
	  	 "due_date": 1486681296
     }
   ]
}
  ```

### Response

  ```javascript
  {
  "success": true,
  "result": [
    {
      "context-file-timestamp-tasks-timestamp-long": 1,
      "id": 1,
      "total": 1
    },
    {
      "context-file-timestamp-tasks-timestamp-long": 0.46153846153846156,
      "id": 2,
      "total": 0.46153846153846156
    }
  ]
}
  ```