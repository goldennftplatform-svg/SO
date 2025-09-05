use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint, MintTo};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("Cmkuew2GUYTjZh8QQnP8NzSq9wAJtoJ64vUViPUkdgUk");

#[program]
pub mod TOKEN {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.authority = ctx.accounts.authority.key();
        state.is_initialized = true;
        state.total_supply = 0;
        state.burned_tokens = 0;
        state.jackpot_amount = 0;
        state.current_round = 1;
        state.total_entries = 0;
        state.total_lp_fees_collected = 0;
        state.last_lp_sync = 0;
        state.total_liquidity_provided = 0;
        state.lp_participants = 0;
        state.total_tax_collected = 0;
        state.token_mint = ctx.accounts.token_mint.key();
        Ok(())
    }

    pub fn enter_lottery(ctx: Context<EnterLottery>, entry_tier: u8) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let user_state = &mut ctx.accounts.user_state;
        
        // Validate entry tier
        require!(
            entry_tier == 1 || entry_tier == 2 || entry_tier == 4 || entry_tier == 8,
            ErrorCode::InvalidEntryTier
        );
        
        // Calculate amount based on entry tier (in tokens with 6 decimals)
        let amount = match entry_tier {
            1 => 20_000_000,  // $20 worth
            2 => 100_000_000, // $100 worth
            4 => 500_000_000, // $500 worth
            8 => 1_000_000_000, // $1000 worth
            _ => return Err(ErrorCode::InvalidEntryTier.into()),
        };
        
        // Transfer tokens to lottery pool
        let transfer_instruction = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.lottery_pool.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );
        token::transfer(cpi_ctx, amount)?;
        
        // Update user state
        user_state.entries += entry_tier as u64; // 1 entry per tier
        user_state.total_contributed += amount;
        
        // Update global state
        state.total_entries += entry_tier as u64;
        state.jackpot_amount += amount;
        
        Ok(())
    }

    pub fn draw_winner(ctx: Context<DrawWinner>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(state.is_initialized, ErrorCode::NotInitialized);
        require!(ctx.accounts.authority.key() == state.authority, ErrorCode::Unauthorized);
        
        // Simple random selection (in production, use proper randomness)
        let _winner_index = (state.total_entries / 2) % state.total_entries;
        
        // Transfer jackpot to winner
        let transfer_instruction = Transfer {
            from: ctx.accounts.lottery_pool.to_account_info(),
            to: ctx.accounts.winner_token_account.to_account_info(),
            authority: ctx.accounts.lottery_authority.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );
        token::transfer(cpi_ctx, state.jackpot_amount)?;
        
        // Reset for next round
        state.current_round += 1;
        state.jackpot_amount = 0;
        state.total_entries = 0;
        
        Ok(())
    }

    pub fn burn_tokens(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(state.is_initialized, ErrorCode::NotInitialized);
        
        // Transfer tokens to burn account (in production, actually burn them)
        let transfer_instruction = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.burn_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );
        token::transfer(cpi_ctx, amount)?;
        
        state.burned_tokens += amount;
        
        Ok(())
    }

    pub fn sync_dual_lp(ctx: Context<SyncDualLp>, trading_fees: u64) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(state.is_initialized, ErrorCode::NotInitialized);
        require!(ctx.accounts.authority.key() == state.authority, ErrorCode::Unauthorized);
        
        // Get current LP pool sizes
        let main_pool_balance = ctx.accounts.main_lp_pool.amount;
        let secondary_pool_balance = ctx.accounts.secondary_lp_pool.amount;
        
        // Determine which pool is smaller
        let (smaller_pool, _larger_pool) = if main_pool_balance < secondary_pool_balance {
            (ctx.accounts.main_lp_pool.to_account_info(), ctx.accounts.secondary_lp_pool.to_account_info())
        } else {
            (ctx.accounts.secondary_lp_pool.to_account_info(), ctx.accounts.main_lp_pool.to_account_info())
        };
        
        // Transfer fees to the smaller pool to rebalance
        let transfer_instruction = Transfer {
            from: ctx.accounts.fee_collector.to_account_info(),
            to: smaller_pool,
            authority: ctx.accounts.lp_authority.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );
        token::transfer(cpi_ctx, trading_fees)?;
        
        // Update state
        state.total_lp_fees_collected += trading_fees;
        state.last_lp_sync = Clock::get()?.unix_timestamp;
        
        Ok(())
    }

    pub fn add_liquidity(ctx: Context<AddLiquidity>, token_amount: u64, sol_amount: u64) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(state.is_initialized, ErrorCode::NotInitialized);
        
        // For now, only handle SOL liquidity (token_amount should be 0)
        require!(token_amount == 0, ErrorCode::InvalidEntryTier); // Reuse error for simplicity
        
        // Transfer SOL to LP pool (wrapped as WSOL)
        let sol_transfer = Transfer {
            from: ctx.accounts.user_sol_account.to_account_info(),
            to: ctx.accounts.lp_sol_pool.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        
        let sol_cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            sol_transfer,
        );
        token::transfer(sol_cpi_ctx, sol_amount)?;
        
        // Update LP state
        state.total_liquidity_provided += sol_amount;
        state.lp_participants += 1;
        
        Ok(())
    }

    pub fn buy_tokens(ctx: Context<BuyTokens>, sol_amount: u64) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(state.is_initialized, ErrorCode::NotInitialized);
        
        // Calculate 2.5% tax
        let tax_amount = (sol_amount * 25) / 1000; // 2.5% = 25/1000
        let net_amount = sol_amount - tax_amount;
        
        // Transfer SOL to LP pool (net amount)
        let sol_transfer = Transfer {
            from: ctx.accounts.user_sol_account.to_account_info(),
            to: ctx.accounts.lp_sol_pool.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        
        let sol_cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            sol_transfer,
        );
        token::transfer(sol_cpi_ctx, net_amount)?;
        
        // Transfer tax to fee collector
        let tax_transfer = Transfer {
            from: ctx.accounts.user_sol_account.to_account_info(),
            to: ctx.accounts.fee_collector.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        
        let tax_cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            tax_transfer,
        );
        token::transfer(tax_cpi_ctx, tax_amount)?;
        
        // Calculate tokens to give (simplified bonding curve)
        let tokens_to_give = net_amount * 1000000; // 1 SOL = 1M tokens (6 decimals)
        
        // Transfer tokens to user
        let token_transfer = Transfer {
            from: ctx.accounts.token_vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.token_authority.to_account_info(),
        };
        
        let token_cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token_transfer,
        );
        token::transfer(token_cpi_ctx, tokens_to_give)?;
        
        // Update state
        state.total_supply += tokens_to_give;
        state.total_tax_collected += tax_amount;
        
        Ok(())
    }

    pub fn sell_tokens(ctx: Context<SellTokens>, token_amount: u64) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(state.is_initialized, ErrorCode::NotInitialized);
        
        // Calculate 2.5% tax
        let tax_amount = (token_amount * 25) / 1000; // 2.5% = 25/1000
        let net_amount = token_amount - tax_amount;
        
        // Transfer tokens from user
        let token_transfer = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.token_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        
        let token_cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token_transfer,
        );
        token::transfer(token_cpi_ctx, token_amount)?;
        
        // Calculate SOL to give (simplified bonding curve)
        let sol_to_give = net_amount / 1000000; // 1M tokens = 1 SOL (6 decimals)
        let sol_tax = (sol_to_give * 25) / 1000; // 2.5% tax on SOL
        let net_sol = sol_to_give - sol_tax;
        
        // Transfer SOL to user (net amount)
        let sol_transfer = Transfer {
            from: ctx.accounts.lp_sol_pool.to_account_info(),
            to: ctx.accounts.user_sol_account.to_account_info(),
            authority: ctx.accounts.lp_authority.to_account_info(),
        };
        
        let sol_cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            sol_transfer,
        );
        token::transfer(sol_cpi_ctx, net_sol)?;
        
        // Transfer SOL tax to fee collector
        let tax_transfer = Transfer {
            from: ctx.accounts.lp_sol_pool.to_account_info(),
            to: ctx.accounts.fee_collector.to_account_info(),
            authority: ctx.accounts.lp_authority.to_account_info(),
        };
        
        let tax_cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            tax_transfer,
        );
        token::transfer(tax_cpi_ctx, sol_tax)?;
        
        // Update state
        state.total_supply -= token_amount;
        state.total_tax_collected += sol_tax;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 1 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 32,
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, StateAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: This is the token mint that will be created
    pub token_mint: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EnterLottery<'info> {
    #[account(mut)]
    pub state: Account<'info, StateAccount>,
    
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8 + 8,
        seeds = [b"user", user.key().as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserState>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub lottery_pool: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DrawWinner<'info> {
    #[account(mut)]
    pub state: Account<'info, StateAccount>,
    
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub lottery_pool: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub winner_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: This is the lottery authority PDA
    pub lottery_authority: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub state: Account<'info, StateAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub burn_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SyncDualLp<'info> {
    #[account(mut)]
    pub state: Account<'info, StateAccount>,
    
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub main_lp_pool: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub secondary_lp_pool: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub fee_collector: Account<'info, TokenAccount>,
    
    /// CHECK: This is the LP authority PDA
    pub lp_authority: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut)]
    pub state: Account<'info, StateAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_sol_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub lp_pool: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub lp_sol_pool: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BuyTokens<'info> {
    #[account(mut)]
    pub state: Account<'info, StateAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub user_sol_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub lp_sol_pool: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub fee_collector: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub token_vault: Account<'info, TokenAccount>,
    
    /// CHECK: This is the token authority PDA
    pub token_authority: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SellTokens<'info> {
    #[account(mut)]
    pub state: Account<'info, StateAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_sol_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub lp_sol_pool: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub fee_collector: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub token_vault: Account<'info, TokenAccount>,
    
    /// CHECK: This is the LP authority PDA
    pub lp_authority: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct StateAccount {
    pub authority: Pubkey,
    pub is_initialized: bool,
    pub total_supply: u64,
    pub burned_tokens: u64,
    pub jackpot_amount: u64,
    pub current_round: u64,
    pub total_entries: u64,
    pub total_lp_fees_collected: u64,
    pub last_lp_sync: i64,
    pub total_liquidity_provided: u64,
    pub lp_participants: u64,
    pub total_tax_collected: u64,
    pub token_mint: Pubkey,
}

#[account]
pub struct UserState {
    pub user: Pubkey,
    pub entries: u64,
    pub total_contributed: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Not initialized")]
    NotInitialized,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid entry tier - must be 1, 2, 4, or 8")]
    InvalidEntryTier,
}
