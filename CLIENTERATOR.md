# Clienterator

We use Clienterator to create an OAuth client id to be used for Ping and Akana.

## Table Of Contents

* [Documentation](#docs)
* [Creating/Editing A Client](#createedit)
  * [Creating A Client](#create)
  * [Editing A Client](#edit)
* [Creating A Route For Your App In Ocelot](#route)
* [Adding A Client To Ocelot](#ocelot)

<a name="docs"></a>
## Documentation

Clienterator documentation is located at: https://github.platforms.engineering/pages/Profile/clienterator/

<a name="createedit"></a>
## Creating/Editing A Client

In order to create or edit a client, you need Clienterator entitlements. These can be requested at: https://velocity-np.ag/entitlements/clienterator

<a name="create"></a>
### Creating A Client

1. Go to https://velocity-np.ag/oauth-clients
2. Click New -> 'UI Client' or 'Service or API Client'
3. Select/Create Crew (User Group)
4. Select 'Product Development' as Organization
5. Give the client a name
6. Set 'Redirect URLs' (Internal application urls. Can just use asterisks)
7. Save And Copy Client Key and Secret Key (don't lose these)

<a name="edit"></a>
### Editing A Client

1. Go to https://velocity-np.ag/oauth-clients
2. Select your client
3. Click Edit
4. Edit appropriate fields

<a name="route"></a>
## Creating A Route For Your App In Ocelot

1. Go to https://ocelot.velocity-np.ag/
2. Click "add route" under the 'My Routes' search bar
3. Edit host, and provide as the AWS CloudFoundry URL
4. Set up Security
    * Click "Enable UI Security"
    * Provide a Cookie Name
    * Input the Clienterator Client ID
    * Input the Clienterator Client Secret
5. Edit Client Whitelist as needed
6. Set up User Profile Integration as needed
7. Edit Advanced Settings as needed (leave defaults)

<a name="ocelot"></a>
## Adding Client To Ocelot

1. Go to https://ocelot.velocity-np.ag/
2. Search for target route
3. Edit Client Whitelist
4. Add Client ID to the whitelist
