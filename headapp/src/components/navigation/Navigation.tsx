'use client';
import { useTranslations } from "next-intl";
import React, { useState, JSX } from 'react';
import { LinkField, Text, TextField, useSitecore } from '@sitecore-content-sdk/nextjs';
import { CompatibleLink } from 'components/content-sdk/CompatibleLink';
import { ComponentProps } from 'lib/component-props';

interface Fields {
  Id: string;
  DisplayName: string;
  Title: TextField;
  NavigationTitle: TextField;
  Href: string;
  Querystring: string;
  Children: Array<Fields>;
  Styles: string[];
}

interface NavigationListItemProps {
  fields: Fields;
  handleClick: (event?: React.MouseEvent<HTMLElement>) => void;
  relativeLevel: number;
}

interface NavigationProps extends ComponentProps {
  fields: Fields;
}

const getTextContent = (fields: Fields): JSX.Element | string => {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);

  if (fields.NavigationTitle) return <Text field={fields.NavigationTitle} />;
  if (fields.Title) return <Text field={fields.Title} />;
  return fields.DisplayName;
};

const getLinkField = (fields: Fields): LinkField => ({
  value: {
    href: fields.Href,
    title:
      fields.NavigationTitle?.value?.toString() ??
      fields.Title?.value?.toString() ??
      fields.DisplayName,
    querystring: fields.Querystring,
  },
});

const NavigationListItem: React.FC<NavigationListItemProps> = ({
  fields,
  handleClick,
  relativeLevel,
}) => {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);
  const [isActive, setIsActive] = useState(false);
  const { page } = useSitecore();

  const classNames = [...fields.Styles, `rel-level${relativeLevel}`, isActive ? 'active' : ''].join(
    ' '
  );

  const hasChildren = fields.Children?.length > 0;
  const children = hasChildren
    ? fields.Children.map((fields, index) => (
        <NavigationListItem
          key={`${index}-${fields.Id}`}
          fields={fields}
          handleClick={handleClick}
          relativeLevel={relativeLevel + 1}
        />
      ))
    : null;

  return (
    <li className={classNames} key={fields.Id}>
      <div className={`navigation-title ${hasChildren ? 'child' : ''}`}>
        <CompatibleLink field={getLinkField(fields)} editable={page.mode.isEditing} onClick={handleClick}>
          {getTextContent(fields)}
        </CompatibleLink>
        {hasChildren && (
          <button
            type="button"
            className="submenu-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsActive(!isActive);
            }}
            aria-expanded={isActive}
            aria-label={isActive ? `Collapse sub-menu for ${fields.DisplayName}` : `Expand sub-menu for ${fields.DisplayName}`}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              marginLeft: '4px',
              color: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
      </div>
      {hasChildren && <ul className="clearfix">{children}</ul>}
    </li>
  );
};

export const Default = ({ params, fields }: NavigationProps) => {
  const t = useTranslations(process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { page } = useSitecore();
  const { styles, RenderingIdentifier: id } = params;

  if (!Object.values(fields).length) {
    return (
      <div className={`component navigation ${styles}`} id={id}>
        <div className="component-content">{t('Navigation-Navigation')}</div>
      </div>
    );
  }

  const handleToggleMenu = (event?: React.MouseEvent<HTMLElement>, forceState?: boolean) => {
    if (event && page.mode.isEditing) {
      event.preventDefault();
    }

    setIsMenuOpen(forceState ?? !isMenuOpen);
  };

  const navigationItems = Object.values(fields)
    .filter(Boolean)
    .map((item: Fields, index) => (
      <NavigationListItem
        key={`${index}-${item.Id}`}
        fields={item}
        handleClick={(event) => handleToggleMenu(event, false)}
        relativeLevel={1}
      />
    ));

  return (
    <div className={`component navigation ${styles}`} id={id}>
      <div className="menu-mobile-navigate-wrapper">
        <input
          id="mobile-menu-checkbox"
          type="checkbox"
          className="menu-mobile-navigate"
          checked={isMenuOpen}
          onChange={() => handleToggleMenu()}
          aria-label={isMenuOpen ? t('Navigation-CloseNavigationMenu') : t('Navigation-OpenNavigationMenu')}
        />
        <label htmlFor="mobile-menu-checkbox" className="menu-humburger" aria-label={t('Global-ToggleMenu')} />
        <div className="component-content">
          <nav aria-label={t('Global-MainNavigation')}>
            <ul className="clearfix">{navigationItems}</ul>
          </nav>
        </div>
      </div>
    </div>
  );
};
