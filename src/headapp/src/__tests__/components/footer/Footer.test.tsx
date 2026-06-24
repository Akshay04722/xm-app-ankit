import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Default as Footer } from '../../../components/footer/Footer';
import { mockFooterPropsDefault, mockFooterPropsMinimal } from './Footer.mockProps';

describe('Footer Component should', () => {
  it('render without crashing', () => {
    const { container } = render(<Footer {...mockFooterPropsDefault} />);
    expect(container.querySelector('.footer')).toBeInTheDocument();
  });

  it('apply custom styles and rendering ID from params', () => {
    const { container } = render(<Footer {...mockFooterPropsDefault} />);
    const footerElement = container.querySelector('.footer');
    expect(footerElement).toHaveClass('footer-styles');
    expect(footerElement).toHaveAttribute('id', 'footer-test-id');
  });

  it('render the logo image when provided', () => {
    render(<Footer {...mockFooterPropsDefault} />);
    const logoImg = screen.getByAltText('Logo');
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute('src', '/assets/logo.png');
  });

  it('fallback to text when no logo image is provided', () => {
    render(<Footer {...mockFooterPropsMinimal} />);
    expect(screen.getByText('akshayxmc')).toBeInTheDocument();
  });

  it('render footer navigation links correctly', () => {
    render(<Footer {...mockFooterPropsDefault} />);
    const linkHome = screen.getByRole('link', { name: 'Home' });
    const linkShop = screen.getByRole('link', { name: 'Shop' });

    expect(linkHome).toBeInTheDocument();
    expect(linkHome).toHaveAttribute('href', '/');
    expect(linkShop).toBeInTheDocument();
    expect(linkShop).toHaveAttribute('href', '/shop');
  });

  it('fallback to default navigation links when not configured', () => {
    render(<Footer {...mockFooterPropsMinimal} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/About');
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms');
  });

  it('render social links correctly', () => {
    render(<Footer {...mockFooterPropsDefault} />);
    const linkFacebook = screen.getByRole('link', { name: 'Facebook' });
    const linkInstagram = screen.getByRole('link', { name: 'Instagram' });

    expect(linkFacebook).toBeInTheDocument();
    expect(linkFacebook).toHaveAttribute('href', 'https://facebook.com/furniro');
    expect(linkInstagram).toBeInTheDocument();
    expect(linkInstagram).toHaveAttribute('href', 'https://instagram.com/furniro');
  });

  it('fallback to default social links when not configured', () => {
    render(<Footer {...mockFooterPropsMinimal} />);
    expect(screen.getByRole('link', { name: 'Facebook' })).toHaveAttribute('href', 'https://facebook.com');
    expect(screen.getByRole('link', { name: 'Twitter' })).toHaveAttribute('href', 'https://twitter.com');
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://linkedin.com');
  });

  it('render copyright text correctly', () => {
    render(<Footer {...mockFooterPropsDefault} />);
    expect(screen.getByText('2023 furino. All rights reserved')).toBeInTheDocument();
  });

  it('fallback to default copyright text when not configured', () => {
    render(<Footer {...mockFooterPropsMinimal} />);
    expect(screen.getByText('© 2026 akshayxmc. All rights reserved.')).toBeInTheDocument();
  });
});
