use anchor_lang::prelude::*;

declare_id!("6fF8UsauBAfBoQYxcnFBHsqX25yy5dM5VpAUcPtnZAtq");

#[program]
pub mod lp {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.authority = ctx.accounts.authority.key();
        state.current_round = 0;
        state.jackpot_amount = 0;
        state.total_entries = 0;
        state.is_initialized = true;
        Ok(())
    }

    pub fn enter_lottery(ctx: Context<EnterLottery>, amount: u64) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(state.is_initialized, ErrorCode::NotInitialized);
        
        state.total_entries += 1;
        state.jackpot_amount += amount;
        
        Ok(())
    }

    pub fn draw_winner(ctx: Context<DrawWinner>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        require!(state.is_initialized, ErrorCode::NotInitialized);
        require!(state.authority == ctx.accounts.authority.key(), ErrorCode::Unauthorized);
        
        state.current_round += 1;
        state.total_entries = 0;
        state.jackpot_amount = 0;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 8 + 8 + 1,
        seeds = [b"state"],
        bump
    )]
    pub state: Account<'info, LotteryState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EnterLottery<'info> {
    #[account(mut)]
    pub state: Account<'info, LotteryState>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct DrawWinner<'info> {
    #[account(mut)]
    pub state: Account<'info, LotteryState>,
    pub authority: Signer<'info>,
}

#[account]
pub struct LotteryState {
    pub authority: Pubkey,
    pub current_round: u64,
    pub jackpot_amount: u64,
    pub total_entries: u64,
    pub is_initialized: bool,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Lottery not initialized")]
    NotInitialized,
    #[msg("Unauthorized")]
    Unauthorized,
}

