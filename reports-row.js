import React, { Component } from 'react';
import T from 'components/i18n';
import Money from 'components/money';
import ExpensesStore from '../expenses/expenses-store';
import formatDate from 'tools/format-date';
import NumberBlock from 'components/number-block';

import List from 'react-bulma-components/lib/components/list';
import Columns from 'react-bulma-components/lib/components/columns';
// import Heading from 'react-bulma-components/lib/components/heading';

import User from 'user/user-store';

import { isMobile } from 'react-device-detect';

import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Actions from './expenses-actions';

import Level from 'react-bulma-components/lib/components/level';
import Button from 'react-bulma-components/lib/components/button';

import { Link } from 'react-router-dom';

// додано для модалки
import AddExpensesModal from 'modules/expenses/add-expenses-modal';
import AppStore from 'app-store';

class ReportsRow extends Component {
  constructor(props) {
    super(props);

    this.deleteExpenses = this.deleteExpenses.bind(this);
    this.renderDesktop = this.renderDesktop.bind(this);
    this.renderMobile = this.renderMobile.bind(this);
  }

  // видалення витрат по id з вікном перевіркою намірів.
  deleteExpenses(_id) {
    confirmAlert({
      title: T('confirm-delete'),
      message: T('are-you-sure-to-delete-this-expenses'),
      buttons: [
        {
          label: T('delete'),
          onClick: () => Actions.deleteExpenses(_id),
        },
        {
          label: T('no-delete'),
          onClick: () => {},
        },
      ],
    });
  }

  // отримання назви витрат, а якщо є доставка то до імені додається id доставки.
  getExpensesName(data) {
    let name = data['name'].indexOf('t-') > -1 ? T(data['name']) : data['name'];

    if (data['shipment_id']) {
      name += '. ' + T('shipment') + ' ID: ' + data['shipment_id'];
    }

    return name;
  }

  // Мій код для відкриття модалки з редагуванням
  editExpenses(_id) {
    const data = ExpensesStore.getExpensesById(_id);
    AppStore.openModal(<AddExpensesModal data={data} />);
  }

  // рендер для мобілок рядка таблиці з одною клітинкою
  renderMobile(amount, data) {
    return (
      <tr key={data['id']} className="is-size-7" colSpan="7">
        <td style={{ textAlign: 'left', paddingTop: '10px' }}>
          {/* назва витрат */}
          <b style={{ fontSize: '1.5rem' }}>{this.getExpensesName(data)}</b>
          <Level className="is-mobile margin-bottom0">
            <Level.Side align="left">
              {/* тип витрат */}
              <Level.Item>
                {T('reports-type')}: {T(data['expenses_type'])}
              </Level.Item>
            </Level.Side>

            {/* дата створення */}
            <Level.Side align="right">
              <Level.Item>{formatDate(data['created_at'])}</Level.Item>
            </Level.Side>
          </Level>

          {/* список з category_name та  account_id*/}
          <List>
            <List.Item>
              <b>
                {T('reports-category')}:{' '}
                <span className="text-success">{T(data['category_name'])}</span>
              </b>
            </List.Item>
            <List.Item>
              {T('reports-account')}: {T(ExpensesStore.getAccountName(data['account_id']))}
            </List.Item>
          </List>

          {/* колонка з витратами та балансом */}
          <Columns className="is-mobile product-mobile-block">
            <Columns.Column size="half">
              <NumberBlock
                top="reports-amount"
                number={amount}
                bottom={User.getCurrency()}
                className="small-number-box"
              />
            </Columns.Column>
            <Columns.Column>
              <NumberBlock
                top="reports-balance"
                number={data['balance']}
                bottom={User.getCurrency()}
                className="small-number-box"
              />
            </Columns.Column>
          </Columns>

          <Level renderAs="nav" breakpoint="mobile" className="is-mobile">
            <Level.Side align="left">
              <Level.Item></Level.Item>
            </Level.Side>
            <Level.Side align="right">
              <Level.Item>
                {/* кнопка видалення витрат, з іконкою */}
                <Button
                  size="small"
                  rounded
                  color="light"
                  onClick={() => this.deleteExpenses(data['id'])}
                >
                  <FontAwesomeIcon icon="trash-alt" size="2x" title={T('delete')} />
                </Button>
              </Level.Item>
              <Level.Item>
                {/* кнопка редагування витрат, з іконкою */}
                <Button
                  size="small"
                  rounded
                  color="light"
                  onClick={() => this.editExpenses(data['id'])}
                >
                  <FontAwesomeIcon icon="edit" size="2x" title={T('edit')} />
                </Button>
              </Level.Item>
            </Level.Side>
          </Level>
        </td>
      </tr>
    );
  }

  // рендер для десктопу з датою/категорією/типом/балансом/account_id/ посиланням на видалення витрати.
  renderDesktop(amount, data) {
    return (
      <tr key={data['id']}>
        <td>{formatDate(data['created_at'])}</td>
        <td>{T(data['category_name'])}</td>
        <td>{this.getExpensesName(data)}</td>
        <td>{T(data['expenses_type'])}</td>
        <td>
          <Money amount={amount} aid={data['account_id']} signClassname={true} />
        </td>
        <td>
          <Money amount={data['balance']} aid={data['account_id']} />
        </td>
        <td>{T(ExpensesStore.getAccountName(data['account_id']))}</td>
        <td>
          <Link to="#" onClick={() => this.deleteExpenses(data['id'])} title={T('delete')}>
            <FontAwesomeIcon icon="trash-alt" size="1x" />
          </Link>
        </td>
        {/* Моя кнопка редагування витрат */}
        <td>
          <Link to="#" onClick={() => this.editExpenses(data['id'])} title={T('edit')}>
            <FontAwesomeIcon icon="edit" size="1x" />
          </Link>
        </td>
      </tr>
    );
  }

  // головний рендер відповідно до вьюпорту.
  render() {
    const buildRow = isMobile ? this.renderMobile : this.renderDesktop,
      { data } = this.props;
    let amount = data['amount'];
    if (!data['is_receipt']) {
      amount *= -1;
    }
    // buildRow з аргументами
    return buildRow(amount, data);
  }
}

export default ReportsRow;
