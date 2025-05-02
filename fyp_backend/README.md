File structure example:
your_project/
├── app/
│   ├── __init__.py
│   ├── models/ FOR DB
│   │   ├── user.py
│   │   └── post.py
│   ├── routes/ 
│   │   ├── user.py
│   │   └── post.py
│   ├── modules/ FUNCTIONS FOR ROUTE
│   └── utils/ FOR REUSABLE FUNCTIONS
│       ├── database.py
│       └── helpers.py
├── tests/
├── requirements.txt
├── config.py
└── run.py