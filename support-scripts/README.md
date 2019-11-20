# Support scripts for Experiments API

## reassign_entries_to_treatments
Ticket: [EXP-384](https://monsanto.aha.io/features/EXP-384)

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
$ cd support-scripts
$ python3 -m pytest test/test_reassign_entries_to_treatments.py -lv
```