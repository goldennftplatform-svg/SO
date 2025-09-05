/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/TOKEN.json`.
 */
export type Token = {
  "address": "Cmkuew2GUYTjZh8QQnP8NzSq9wAJtoJ64vUViPUkdgUk",
  "metadata": {
    "name": "token",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "addLiquidity",
      "discriminator": [
        181,
        157,
        89,
        67,
        143,
        182,
        52,
        72
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "userSolAccount",
          "writable": true
        },
        {
          "name": "lpPool",
          "writable": true
        },
        {
          "name": "lpSolPool",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "tokenAmount",
          "type": "u64"
        },
        {
          "name": "solAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "burnTokens",
      "discriminator": [
        76,
        15,
        51,
        254,
        229,
        215,
        121,
        66
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "burnAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "buyTokens",
      "discriminator": [
        189,
        21,
        230,
        133,
        247,
        2,
        110,
        42
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userSolAccount",
          "writable": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "lpSolPool",
          "writable": true
        },
        {
          "name": "feeCollector",
          "writable": true
        },
        {
          "name": "tokenVault",
          "writable": true
        },
        {
          "name": "tokenAuthority"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "solAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "drawWinner",
      "discriminator": [
        250,
        103,
        118,
        147,
        219,
        235,
        169,
        220
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "lotteryPool",
          "writable": true
        },
        {
          "name": "winnerTokenAccount",
          "writable": true
        },
        {
          "name": "lotteryAuthority"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "enterLottery",
      "discriminator": [
        252,
        72,
        239,
        78,
        58,
        56,
        149,
        231
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "userState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "lotteryPool",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "entryTier",
          "type": "u8"
        }
      ]
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "sellTokens",
      "discriminator": [
        114,
        242,
        25,
        12,
        62,
        126,
        92,
        2
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "userSolAccount",
          "writable": true
        },
        {
          "name": "lpSolPool",
          "writable": true
        },
        {
          "name": "feeCollector",
          "writable": true
        },
        {
          "name": "tokenVault",
          "writable": true
        },
        {
          "name": "lpAuthority"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "tokenAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "syncDualLp",
      "discriminator": [
        105,
        213,
        42,
        11,
        53,
        110,
        201,
        207
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "mainLpPool",
          "writable": true
        },
        {
          "name": "secondaryLpPool",
          "writable": true
        },
        {
          "name": "feeCollector",
          "writable": true
        },
        {
          "name": "lpAuthority"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "tradingFees",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "stateAccount",
      "discriminator": [
        142,
        247,
        54,
        95,
        85,
        133,
        249,
        103
      ]
    },
    {
      "name": "userState",
      "discriminator": [
        72,
        177,
        85,
        249,
        76,
        167,
        186,
        126
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "notInitialized",
      "msg": "Not initialized"
    },
    {
      "code": 6001,
      "name": "unauthorized",
      "msg": "unauthorized"
    },
    {
      "code": 6002,
      "name": "invalidEntryTier",
      "msg": "Invalid entry tier - must be 1, 2, 4, or 8"
    }
  ],
  "types": [
    {
      "name": "stateAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "totalSupply",
            "type": "u64"
          },
          {
            "name": "burnedTokens",
            "type": "u64"
          },
          {
            "name": "jackpotAmount",
            "type": "u64"
          },
          {
            "name": "currentRound",
            "type": "u64"
          },
          {
            "name": "totalEntries",
            "type": "u64"
          },
          {
            "name": "totalLpFeesCollected",
            "type": "u64"
          },
          {
            "name": "lastLpSync",
            "type": "i64"
          },
          {
            "name": "totalLiquidityProvided",
            "type": "u64"
          },
          {
            "name": "lpParticipants",
            "type": "u64"
          },
          {
            "name": "totalTaxCollected",
            "type": "u64"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "userState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "entries",
            "type": "u64"
          },
          {
            "name": "totalContributed",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
