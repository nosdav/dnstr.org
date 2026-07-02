**NIP-134**
=============

**DNSTR - Domain Name Mapping for Nostr Public Keys**
-----------------------------------------------------

`draft` `optional` `author:melvincarvalho`

This NIP defines a way to associate a Nostr public key with a domain name.

For example:
- `npub1hn4zhxzsd5w4m5kvq326gqnsrc6zcakhparw8pee4tw7wlxw70ysawhtl5.nostr` maps to `alice.com`
- `bcea2b98506d1d5dd2cc0455a402701e342c76d70f46e38739aadde77ccef3c9.nostr` maps to `bob.net`

This is useful for services and individuals who wish to associate their Nostr public key with a domain name for easy referencing, identification, or branding purposes.

## Nostr event

A `kind 31034` event is used.

The `content` SHOULD be the empty string and is reserved for future use.  It could contain strings similar to a DNS record.

The following tags are defined as REQUIRED:

* `u` - uri is the uri of the domain to be redirected to.  The URI SHOULD NOT contain a path.  Clients SHOULD strip a path from any origin in the u tag.
* `d` - should be the empty string reserved for future use.

Example event:

```json
{
    "id": "exampleid1234567890",
    "pubkey": "examplepubkey1234567890",
    "content": "",
    "kind": 31034,
    "created_at": 1682327852,
    "tags": [
        [
            "u", "http://example.com",
            "d", ""
        ]
    ],
    "sig": "exampleSignature"
}
```

Services and tools that wish to make use of this NIP SHOULD first verify the authenticity of the event by checking the signature and then map the domain name specified in the content to `npub.nostr` or `pubkey.nostr`.

## Implementation

In order to lookup a .nostr domain you simply query the pubkey with kind=31034 and use the field in the content as the domain.  Some lookup services may choose to fallback to profile web page or nip-05 origin, as desired.

### did:nostr resolution

Lookups can also be performed via [did:nostr](https://did-nostr.com), where a Nostr public key is a W3C Decentralized Identifier.  A resolver serves DID documents at the well-known path:

```
https://<resolver>/.well-known/did/nostr/<pubkey>.json
```

The DID document contains the profile `website` (and optionally `alsoKnownAs` links), which provides the pubkey-to-domain mapping.

### CLI

The `dnstr` command resolves a Nostr identity to its domain using did:nostr.  It accepts an npub, a hex pubkey, or a `did:nostr:` identifier:

```bash
npx dnstr npub1melv683fw6n2mvhl5h6dhqd8mqfv3wmxnz4qph83ua4dk4006ezsrt5c24
# https://melvincarvalho.com/

dnstr did:nostr:de7ecd1e2976a6adb2ffa5f4db81a7d812c8bb6698aa00dcf1e76adb55efd645
# https://melvincarvalho.com/

dnstr --doc <id>   # print the full DID document
```

The default resolver is `https://nostr.social` and can be overridden with the `DNSTR_RESOLVER` environment variable.

## Use Case

By having a Nostr public key mapped to a domain name, users and services can easily share, reference, or verify the authenticity of a domain based on its associated Nostr public key.

For instance, if Alice wants to verify that `example.com` is genuinely associated with a specific Nostr public key, she can look up the Nostr event with `kind 31034` and verify the domain name in the content.

## Related Work

- [did:nostr](https://did-nostr.com)
- [PKARR](https://github.com/pubky/pkarr)
- [NOMEN](https://github.com/ursuscamp/nomen/blob/master/docs/SPEC.md)
