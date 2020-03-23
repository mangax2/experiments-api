-- Culture Media
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'503be58a-8ad6-48d1-ad8d-a2f08f9108e7',
		'3efba679-3ab0-4f55-b043-2f0f026f1e82'
	);

-- Formulation Blank
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'076d9a97-5335-4bd9-9e65-412cc067e327',
		'45370712-9a7c-48e0-8df7-d6b523e3ea8b'
	);

-- Inoculated - Treated
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'59bb9318-c4db-481d-9994-e2a96cab7c3d',
		'4be5b24c-122f-44d4-9ca8-b1a41ad94592'
	);

-- Inoculated - Untreated
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'117a22d8-862e-48c5-987f-13ba6ec21733',
		'dc293e97-3afb-4e76-9324-9bc7eefe91b5'
	);

-- Mock-Inoculated - Treated
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'4c6c3d5b-7690-41c5-8bdb-7b793ce3fa86',
		'45eae161-faa4-4952-b18f-9fe9cada9ec9'
	);

-- Mock-Inoculated - Untreated
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'4b1e7af6-eb81-42d1-a1e3-470ffe907294',
		'39eac07b-0b3a-4122-8ba7-d0604cadb559'
	);

-- Maturity
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'd0f6aa7f-9670-4f1f-882d-6c7aecb4f586',
		'5c90e8b2-6d1f-4414-910b-b9f26f3ca3e7'
	);

-- Multiple
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'5cf20c82-fc36-4c4e-8be8-fe445c4d52ba',
		'6857cfba-7705-4913-93b1-f5b3c04f4317'
	);

-- Negative
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'76b78379-f6b7-4377-8167-f9ed6717596c',
		'0d7f3609-c63d-4705-8aee-c3677f09072d'
	);

-- Non-Inoculated - Treated
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'e957b549-f009-4812-9914-6f59dbf75f33',
		'404d2075-ac3c-48fb-a65e-a11acb76033a'
	);

-- Non-Inoculated - Untreated
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'f4087e4f-114b-4be0-b3a4-5fb4b87610f9',
		'4fc280d9-4637-4023-bc3a-8af146293fae'
	);

-- Non-specific
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'f1b066e4-a41c-4efa-8d5d-c073406341b7',
		'08a1ed3e-33ec-45b3-a7fa-9634258efa1d'
	);

-- Performance
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'ae504f8d-818e-4283-8ae4-020567efff8a',
		'b4a09539-27c7-4856-9077-adbfcbbeffa1'
	);

-- Positive
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'0999ee33-6660-47db-b961-6d1411abfa7c',
		'9ab1c329-b81a-4dbb-8efa-f7b69ac3f7f4'
	);

-- Resistant
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'f8716948-12ac-4891-8096-ea7da4179635',
		'95392bff-4a9f-4b64-86bf-d5cd21ffbc30'
	);

-- Spatial
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'2e8fe8f1-fd0e-4a44-bdd0-f15d7a7f9abc',
		'42864ffd-6b49-4c90-a32c-0e91a70961c2'
	);

-- Susceptible
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'c8b48218-aacb-4716-8c82-9ce35a976757',
		'c82ceb9a-1a6b-43a2-a06c-c8081528cc10'
	);

-- Traited
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'a07fe8cd-f538-47fd-a528-0c98ba4ef38c',
		'1877095f-1666-4c56-b6a1-849007cba189'
	);

-- Transformation
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'96252d4f-ede7-48de-ac23-1fbc9eebfc8a',
		'1aa8a28d-8422-4816-ac6e-f8cf822b2658'
	);

-- Uninfested
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'54f96a20-0e23-4105-aac1-e34b3b9ea02b',
		'42131279-9abd-47a8-bb7b-0e603fe93710'
	);

-- Untraited
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'de7e78bd-e582-426a-a3a2-05d7869947f7',
		'ff534e4e-f06f-4fc1-8f02-64acde38b871'
	);

-- Untreated
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'af6d651d-01c0-4083-8dca-ffed57fb0bcc',
		'340ec050-9827-48f2-8c43-8e73913cb286'
	);

-- Water/OD
UPDATE treatment
SET
	control_types = array_replace(
		control_types,
		'0600526c-039a-4792-924b-3c1f609de1b8',
		'808e2281-22c7-4cfa-8b58-5206048c9888'
	);
