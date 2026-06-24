import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Default as Header } from '../../../components/header/Header';
import { mockHeaderPropsDefault, mockHeaderPropsMinimal } from './Header.mockProps';

describe('Header Component should', () => {
  it('render without crashing', () => {
    const { container } = render(<Header {...mockHeaderPropsDefault} />);
    expect(container.querySelector('.header')).toBeInTheDocument();
  });

  it('apply custom styles and rendering ID from params', () => {
    const { container } = render(<Header {...mockHeaderPropsDefault} />);
    const headerElement = container.querySelector('.header');
    expect(headerElement).toHaveClass('header-styles');
    expect(headerElement).toHaveAttribute('id', 'header-test-id');
  });

  it('render the logo image when provided', () => {
    render(<Header {...mockHeaderPropsDefault} />);
    const logoImg = screen.getByAltText('Logo');
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute('src', '/assets/logo.png');
  });

  it('fallback to text when no logo image is provided', () => {
    render(<Header {...mockHeaderPropsMinimal} />);
    expect(screen.getByText('akshayxmc')).toBeInTheDocument();
  });

  it('render navigation links correctly', () => {
    render(<Header {...mockHeaderPropsDefault} />);
    const linkHome = screen.getByRole('link', { name: 'Home' });
    const linkShop = screen.getByRole('link', { name: 'Shop' });
    const linkAbout = screen.getByRole('link', { name: 'About' });
    const linkContact = screen.getByRole('link', { name: 'Contact' });

    expect(linkHome).toBeInTheDocument();
    expect(linkHome).toHaveAttribute('href', '/');
    expect(linkShop).toBeInTheDocument();
    expect(linkShop).toHaveAttribute('href', '/shop');
    expect(linkAbout).toBeInTheDocument();
    expect(linkAbout).toHaveAttribute('href', '/about');
    expect(linkContact).toBeInTheDocument();
    expect(linkContact).toHaveAttribute('href', '/contact');
  });

  it('fallback to default navigation links when navigation links are not configured', () => {
    render(<Header {...mockHeaderPropsMinimal} />);
    const linkHome = screen.getByRole('link', { name: 'Home' });
    const linkAbout = screen.getByRole('link', { name: 'About' });

    expect(linkHome).toBeInTheDocument();
    expect(linkHome).toHaveAttribute('href', '/');
    expect(linkAbout).toBeInTheDocument();
    expect(linkAbout).toHaveAttribute('href', '/About');
  });

  it('render the CTA button with correct label and href', () => {
    render(<Header {...mockHeaderPropsDefault} />);
    const ctaLink = screen.getByRole('link', { name: 'Subscribe' });
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink).toHaveAttribute('href', '/subscribe');
  });

  it('fallback to default CTA label and href when not configured', () => {
    render(<Header {...mockHeaderPropsMinimal} />);
    const ctaLink = screen.getByRole('link', { name: 'Get Started' });
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink).toHaveAttribute('href', '/');
  });
});
