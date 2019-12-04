# Support scripts for Experiments API

## reassign_entries_to_treatments
Ticket: [EXP-384](https://monsanto.aha.io/features/EXP-384)

### Dependencies
* [Pandas](https://pandas.pydata.org/pandas-docs/stable/user_guide/cookbook.html#cookbook) - a data analysis package: 
* [Numpy](https://numpy.org/devdocs/user/quickstart.html) - a N-dimensional array package
* [Pytest](https://docs.pytest.org/en/latest/index.html#) - a testing package using dependency injection
* [Pytest-cases](https://smarie.github.io/python-pytest-cases/#usage-data-cases) - a plugin package for writing test cases

### To run:
```sh
$ pip3 install numpy, pandas, requests, sgqlc, docopt
$ cd support-scripts/reassign_entries_to_treatments
$ python3 reassign_entries_to_treatments.py -h
```

### To test:
```sh
$ pip3 install numpy, pandas, requests, sgqlc, docopt, pytest, pytest_cases
$ cd support-scripts
$ python3 -m pytest test/test_reassign_entries_to_treatments.py -lv
```

### To update regression data:
```sh
$ pip3 install numpy, pandas, requests, sgqlc, docopt, pytest, pytest_cases
$ cd support-scripts/reassign_entries_to_treatments
$ python3 reassign_entries_to_treatments.py --update -e <TOKEN> -s <TOKEN> -v <TOKEN> --experiment <ID>
```
