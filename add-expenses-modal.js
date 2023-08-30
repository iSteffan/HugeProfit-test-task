import React, { Component } from 'react';
import T from 'components/i18n';
import { connectToStores } from 'tools/reflux-tools';
import getQueryParams from 'tools/query-params';
import { redirectTo } from 'tools/redirect-to';
import { Field, Control, Input, Radio, Label } from 'react-bulma-components/lib/components/form';

import Messages from 'components/messages';
import DatePicker from 'react-datepicker';

import 'react-datepicker/dist/react-datepicker.css';

import Box from 'react-bulma-components/lib/components/box';
import Columns from 'react-bulma-components/lib/components/columns';
import Button from 'react-bulma-components/lib/components/button';

import ExpensesStore from './expenses-store';
import ExpensesActions from './expenses-actions';
import ProductsStore from '../products/products-store';

import ShipmentsStore from '../shipments/shipments-store';
import ShipmentsActions from '../shipments/shipments-actions';

import SelectComponent from 'tools/select-component';
import AppStore from 'app-store';

import SubmitButton from 'components/submit-button';
import trackEvent from 'tools/track-events';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import { Link } from "react-router-dom";
import User from 'user/user-store';
import { isMobile } from 'react-device-detect';

// import SelectComponent from 'tools/select-component'

class AddExpensesModal extends Component {
  constructor(props) {
    super(props);
    let category = null;
    if (this.props.category_id) {
      category = {
        value: this.props.category_id,
      };
    }

    let shipment = null;
    if (this.props.shipment_id) {
      shipment = {
        value: this.props.shipment_id,
      };
    }

    this.state = {
      comment: {
        error: '',
        value: this.props.comment || '',
      },
      amount: {
        error: '',
        value: this.props.amount || '',
      },
      types: {
        error: '',
        value: '1',
      },
      account: null,
      date: new Date(),
      category: category,
      shipment: shipment,
      message: null,
      waiting: null,
      close: false,
    };

    this.onChange = this.onChange.bind(this);
    this.onChangeSelect = this.onChangeSelect.bind(this);
    this.onChangeDateSaled = this.onChangeDateSaled.bind(this);

    this.submit = this.submit.bind(this);
  }

  // виконується при першому рендері компонента
  componentDidMount() {
    // зчитуєм product_id з рядка запиту(моя догадка)
    let product_id = getQueryParams('product');
    // якщо є product_id - створюємо новий стан
    if (product_id) {
      this.setState({ product: { value: product_id, error: '' } });
    }

    // при невдалій спробі додавання - змінюємо стейт
    this.listenAddFaild = ExpensesActions.addExpenses.failed.listen(res => {
      const data = JSON.parse(res['response']);
      this.setState({
        waiting: false,
        message: {
          msg: T(data['error']),
        },
      });
    });

    // при успішному додаванні - за 100мс close стає true та викликається AppStore.closeModal();

    this.listenAddCompleted = ExpensesActions.addExpenses.completed.listen(() => {
      setTimeout(() => {
        this.setState({ close: true });
        AppStore.closeModal();
      }, 100);
    });
  }

  // викликаємо функції при розмонтовуванні компонента
  componentWillUnmount() {
    if (typeof this.listenAddFaild == 'function') {
      this.listenAddFaild();
    }
    if (typeof this.listenAddCompleted == 'function') {
      this.listenAddCompleted();
    }
  }

  // сабміт форми
  submit() {
    // якщо немає аккаунту чи account.value === 0 записуємо повідомлення в стейт
    if (!this.state.account || this.state.account.value === 0) {
      this.setState({
        message: {
          msg: T('not all fields required'),
        },
      });

      return false;
    }
    // зчитування стану
    const account = this.state.account.value,
      comment = this.state.comment.value,
      types = this.state.types.value,
      date = this.state.date,
      category = this.state.category.value,
      shipment = this.state.shipment && this.state.shipment.value ? this.state.shipment.value : 0,
      amount = this.state.amount.value || 0;

    // видаляємо пробіли в коментарях та перевіряємо їх наявність - записуємо повідомлення в стейт
    if (comment.trim() === '' || amount <= 0) {
      this.setState({
        message: {
          msg: T('not all fields required'),
        },
      });

      return false;
    }

    let inventory_id = 0;
    if (this.props.inventory_id) {
      inventory_id = this.props.inventory_id;
    }

    this.setState({ waiting: true });

    // передаємо дані в глобальний стан (використовується певна бібліотека управління станом)
    ExpensesActions.addExpenses(
      account,
      amount,
      comment,
      types,
      category,
      shipment,
      date,
      inventory_id
    );
    trackEvent('users', 'working', 'add-expenses');
  }

  onChange(evt) {
    const value = evt.target.value,
      name = evt.target.name;

    this.setState({
      [name]: {
        value: value,
      },
    });
  }

  // оновлення дати в стейті
  onChangeDateSaled(date) {
    this.setState({
      date: date,
    });
  }

  // оновлюєм селект в стейті
  onChangeSelect(selectedOption, actionMeta) {
    this.setState({
      [actionMeta.name]: selectedOption,
    });
  }

  render() {
    // запис повідомлення в змінну const
    const mess = this.state.message && this.state.message['msg'] ? this.state.message['msg'] : null;
    return (
      <div>
        {/* показ повідомлення */}
        <Messages message={mess} close={() => this.setState({ message: null })} />
        <Box>
          <Field>
            <Control>
              {/* контрольований інпут з введенням величини витрати */}
              <Label>{T('expenses-amount')}</Label>
              <Input
                size="large"
                name="amount"
                type="number"
                min="0.01"
                placeholder={T('expenses-amount-placeholder')}
                onChange={this.onChange}
                color={this.state.amount.error ? 'danger' : ''}
                value={this.state.amount.value}
              />
            </Control>
          </Field>

          <Field>
            <Control>
              {/* контрольований інпут з введенням назви витрати */}
              <Label>{T('expenses-name')}</Label>
              <Input
                size="large"
                name="comment"
                type="text"
                placeholder={T('expenses-comment-placeholder')}
                onChange={this.onChange}
                color={this.state.comment.error ? 'danger' : ''}
                value={this.state.comment.value}
              />
            </Control>
          </Field>

          <Field>
            {/* селект, значення зі стейту null. перелік опцій з  getCategoryList*/}
            <SelectComponent
              name="category"
              label="expenses-category"
              onChange={this.onChangeSelect}
              value={this.state.category}
              list={ExpensesStore.getCategoryList}
              addItem={ExpensesActions.addCategory}
              load={ExpensesActions.loadCategory}
              creatable={true}
            />
          </Field>
          {/* перевірка чи category=true і чи value === 11*/}
          {this.state.category && this.state.category.value === 11 ? (
            <Field>
              {/* селект з списком ShipmentsStore.getList() */}
              <SelectComponent
                name="shipment"
                label="select-shipment"
                onChange={this.onChangeSelect}
                value={this.state.shipment}
                list={() => ShipmentsStore.getList()}
                load={ShipmentsActions.load}
                creatable={false}
              />
            </Field>
          ) : null}
          <Field>
            {/* радіокнопки з вибором однієї опції - типом витрат */}
            <Label>{T('expenses-type')}</Label>
            <Control>
              <Radio
                onChange={this.onChange}
                checked={this.state.types.value === '1'}
                value="1"
                size="large"
                name="types"
              >
                {ExpensesStore.getNameTypeExpenses(1)}
              </Radio>
              <Radio
                onChange={this.onChange}
                checked={this.state.types.value === '2'}
                value="2"
                size="large"
                name="types"
              >
                {ExpensesStore.getNameTypeExpenses(2)}
              </Radio>
            </Control>
          </Field>
          <Columns className={isMobile ? 'is-mobile' : ''}>
            <Columns.Column>
              <Field>
                {/* селект з вибором аккаунта */}
                <SelectComponent
                  name="account"
                  label="debit-the-account"
                  onChange={this.onChangeSelect}
                  value={this.state.account}
                  list={() => ExpensesStore.getPersonalAccounts()}
                  load={ExpensesActions.loadAccounts}
                  creatable={false}
                />
              </Field>
            </Columns.Column>
            <Columns.Column>
              <Field>
                <Label>{T('sale-date')}</Label>
                <Control>
                  {/* вибір дати відправки*/}
                  <DatePicker
                    selected={this.state.date}
                    onChange={this.onChangeDateSaled}
                    className="input"
                    dateFormat="dd-MM-yyyy"
                    popperPlacement="top-left"
                    showTimeInput
                    locale={User.getLang()}
                    maxDate={new Date()}
                    timeFormat="HH:mm"
                  />
                </Control>
              </Field>
            </Columns.Column>
          </Columns>
          {/* кнопка сабміта */}
          <Button.Group>
            <SubmitButton
              text="add-expenses-btn"
              waiting={this.state.waiting}
              submit={this.submit}
            />
          </Button.Group>
          {/* перенаправлення на маршрут /payments */}
          {this.state.close ? redirectTo('/payments') : ''}
        </Box>
      </div>
    );
  }
}

// оновлення глобал сховища
export default connectToStores(AddExpensesModal, {
  expenses: ExpensesStore,
  products: ProductsStore,
});
