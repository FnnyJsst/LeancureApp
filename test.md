erDiagram
    amaiia_msg_srv_sites ||--o{ amaiia_msg_srv_sites_listofchannels : has
    amaiia_msg_srv_sites ||--o{ amaiia_msg_srv_sites_groupsofchannel : has
    amaiia_msg_srv_sites_groupsofchannel ||--o{ amaiia_msg_srv_sites_groupschannels_links : contains
    amaiia_msg_srv_sites_listofchannels ||--o{ amaiia_msg_srv_sites_groupschannels_links : belongs_to
    amaiia_msg_srv_sites_listofchannels ||--o{ amaiia_msg_srv_sites_channels_messages : has
    amaiia_msg_srv_accounts_groups_links }|--|| amaiia_msg_srv_sites_groupsofchannel : links

    amaiia_msg_srv_sites {
        int id PK
        string customername
        string entityname
        string sitename
        string contractnumber
        string msgapikey
        string status
        string description
    }

    amaiia_msg_srv_sites_listofchannels {
        int id PK
        int clientid FK
        string identifier
        boolean isprivate
        int msglifetime
        string description
        datetime creationts
        datetime modificationts
    }

    amaiia_msg_srv_sites_channels_messages {
        int id PK
        int channelid FK
        string title
        string message
        string filetype
        int filesize
        datetime savedts
        datetime endatets
    }

    amaiia_msg_srv_sites_groupsofchannel {
        int id PK
        int clientid FK
        string identifier
        string description
        string groupapikey
        datetime creationts
        datetime modificationts
    }

    amaiia_msg_srv_sites_groupschannels_links {
        int id PK
        int groupid FK
        int channelid FK
        datetime creationts
        datetime modificationts
    }

    amaiia_msg_srv_accounts_groups_links {
        int id PK
        int accountid FK
        int groupid FK
        string rights
        datetime creationts
        datetime modificationts
    }

    amaiia_msg_srv_api_data_short_term_log {
        int id PK
        string ipaddress
        string level_1
        string level_2
        string level_3
        string level_4
        string level_5
        string contractnumber
        int channelid
        string groupidentifier
        string channelidentifier
        string groupapikey
        datetime timestamp
    }

    amaiia_msg_srv_info {
        string dataname PK
        string value
    }
