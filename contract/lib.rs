use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("GbALJtQCRmZbxkn5mhWjPeka75ZQg9tYQD5vCV7hdiSo");

pub const PORTFOLIO_SEED: &[u8] = b"portfolio";
pub const VAULT_SEED: &[u8]     = b"vault";

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug)]
pub enum Strategy {
    StableYield,
    Conservative,
    GrowthFocus,
}

#[account]
pub struct Portfolio {
    pub owner:           Pubkey,
    pub mint:            Pubkey,
    pub strategy:        Strategy,
    pub amount_usdc:     u64,
    pub last_deposit_at: i64,
    pub deposit_count:   u32,
    pub bump:            u8,
}

impl Portfolio {
    pub const LEN: usize = 8 + 32 + 32 + 2 + 8 + 8 + 4 + 1;
}

#[error_code]
pub enum PortfolioError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Cannot withdraw more than deposited")]
    InsufficientFunds,
    #[msg("Arithmetic overflow")]
    Overflow,
}

#[program]
pub mod mock_portfolio {
    use super::*;

    pub fn initialize_and_deposit(
        ctx: Context<InitializeAndDeposit>,
        strategy: Strategy,
        amount_usdc: u64,
    ) -> Result<()> {
        require!(amount_usdc > 0, PortfolioError::ZeroAmount);

        let clock = Clock::get()?;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.user_usdc.to_account_info(),
                    to:        ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            amount_usdc,
        )?;

        let p             = &mut ctx.accounts.portfolio;
        p.owner           = ctx.accounts.owner.key();
        p.mint            = ctx.accounts.usdc_mint.key();
        p.strategy        = strategy;
        p.amount_usdc     = amount_usdc;
        p.last_deposit_at = clock.unix_timestamp;
        p.deposit_count   = 1;
        p.bump            = ctx.bumps.portfolio;

        msg!("Portfolio created strategy={:?} amount={}", strategy, amount_usdc);
        Ok(())
    }

    pub fn deposit(
        ctx: Context<Deposit>,
        strategy: Strategy,
        amount_usdc: u64,
    ) -> Result<()> {
        require!(amount_usdc > 0, PortfolioError::ZeroAmount);

        let clock = Clock::get()?;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.user_usdc.to_account_info(),
                    to:        ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            amount_usdc,
        )?;

        let p             = &mut ctx.accounts.portfolio;
        p.strategy        = strategy;
        p.amount_usdc     = p.amount_usdc.checked_add(amount_usdc).ok_or(PortfolioError::Overflow)?;
        p.last_deposit_at = clock.unix_timestamp;
        p.deposit_count   = p.deposit_count.saturating_add(1);

        msg!("Deposit added={} total={}", amount_usdc, p.amount_usdc);
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount_usdc: u64) -> Result<()> {
        require!(amount_usdc > 0, PortfolioError::ZeroAmount);
        require!(amount_usdc <= ctx.accounts.portfolio.amount_usdc, PortfolioError::InsufficientFunds);

        let owner_key = ctx.accounts.portfolio.owner;
        let bump      = ctx.accounts.portfolio.bump;
        let seeds: &[&[&[u8]]] = &[&[PORTFOLIO_SEED, owner_key.as_ref(), &[bump]]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.vault.to_account_info(),
                    to:        ctx.accounts.user_usdc.to_account_info(),
                    authority: ctx.accounts.portfolio.to_account_info(),
                },
                seeds,
            ),
            amount_usdc,
        )?;

        ctx.accounts.portfolio.amount_usdc = ctx.accounts.portfolio.amount_usdc.saturating_sub(amount_usdc);

        msg!("Withdrew {} remaining={}", amount_usdc, ctx.accounts.portfolio.amount_usdc);
        Ok(())
    }

    pub fn switch_strategy(ctx: Context<SwitchStrategy>, new_strategy: Strategy) -> Result<()> {
        ctx.accounts.portfolio.strategy = new_strategy;
        msg!("Strategy switched to {:?}", new_strategy);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeAndDeposit<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = Portfolio::LEN,
        seeds = [PORTFOLIO_SEED, owner.key().as_ref()],
        bump,
    )]
    pub portfolio: Account<'info, Portfolio>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = owner,
    )]
    pub user_usdc: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = owner,
        token::mint = usdc_mint,
        token::authority = portfolio,
        seeds = [VAULT_SEED, owner.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent:           Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [PORTFOLIO_SEED, owner.key().as_ref()],
        bump = portfolio.bump,
        has_one = owner,
    )]
    pub portfolio: Account<'info, Portfolio>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = owner,
    )]
    pub user_usdc: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [VAULT_SEED, owner.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = portfolio,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [PORTFOLIO_SEED, owner.key().as_ref()],
        bump = portfolio.bump,
        has_one = owner,
    )]
    pub portfolio: Account<'info, Portfolio>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = owner,
    )]
    pub user_usdc: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [VAULT_SEED, owner.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = portfolio,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SwitchStrategy<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [PORTFOLIO_SEED, owner.key().as_ref()],
        bump = portfolio.bump,
        has_one = owner,
    )]
    pub portfolio: Account<'info, Portfolio>,
}