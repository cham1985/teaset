// Carousel.js

'use strict'

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { StyleSheet, View, ScrollView } from 'react-native'

import Theme from 'teaset/themes/Theme'
import CarouselControl from './CarouselControl'

export default class Carousel extends Component {

  static propTypes = {
    ...ScrollView.propTypes,
    carousel: PropTypes.bool, //是否开启轮播
    interval: PropTypes.number, //每页停留时间
    direction: PropTypes.oneOf(['forward', 'backward']), //轮播方向
    startIndex: PropTypes.number, //起始页面编号，从0开始
    cycle: PropTypes.bool, //是否循环
    control: PropTypes.oneOfType([PropTypes.bool, PropTypes.element]),
    onChange: PropTypes.func, //(index, total) 页面改变时调用
  }

  static defaultProps = {
    ...ScrollView.defaultProps,
    horizontal: true, //修改为false是纵向滚动
    pagingEnabled: true,
    showsHorizontalScrollIndicator: false,
    showsVerticalScrollIndicator: false,
    alwaysBounceHorizontal: false,
    alwaysBounceVertical: false,
    bounces: false,
    automaticallyAdjustContentInsets: false,
    scrollEventThrottle: 200,
    scrollsToTop: false,

    carousel: true,
    interval: 3000,
    direction: 'forward',
    startIndex: 0,
    cycle: true,
    control: false,
  }

  static Control = CarouselControl

  constructor (props) {
    super(props)
    const style = props.style
    let width = props.style.width
    let height = props.style.height
    if (style instanceof Array) {
      style.map(
        (value, index, array) => {
          width=value.width
          height=value.height
        }
      )
    }
    this.state = {
      width,//stark: 为了 一开始就获取 width， 因 componentDidMount 的 scrollToCard 方法 会 在 onLayout 前调用，此时 width =0，故 width 从外部 获取
      height,//stark:同上
      pageIndex: 0,
    }
    this.cardIndex = null
    this.initByProps()
    this.setupTimer()
  }

  componentDidMount () {
    super.componentDidMount && super.componentDidMount()

    setTimeout(() => this.scrollToCard(this.cardIndex, false), 50)
  }

  componentWillUnmount () {
    super.componentWillUnmount && super.componentWillUnmount()
    this.removeTimer()
  }

  componentDidUpdate (prevProps) {
    let { children, carousel, direction, startIndex, cycle } = this.props
    let pageCount = children ? (children instanceof Array ? children.length : 1) : 0
    if (pageCount != this.pageCount
      || carousel != prevProps.carousel
      || direction != prevProps.direction
      || startIndex != prevProps.startIndex
      || cycle != prevProps.cycle) {
      this.initByProps()
      this.setupTimer()
    }
  }

  //滚动到指定页
  scrollToPage (index, animated = true) {
    this.scrollToCard(this.cycle ? index + 1 : index, animated)
  }

  //滚动到下一页
  scrollToNextPage (animated = true) {
    this.scrollToNextCard(animated)
  }

  //初始化轮播参数
  initByProps () {
    let { children, carousel, direction, startIndex, cycle } = this.props

    //页数
    this.pageCount = children ? (children instanceof Array ? children.length : 1) : 0

    let multiPage = this.pageCount > 1

    //是否轮播
    this.carousel = carousel && multiPage

    //是否循环
    this.cycle = cycle && multiPage

    //是否正向轮播（从左往右顺序轮播，卡片从右往左滚动）
    this.forward = direction === 'forward'

    //卡片数量，card定义：轮播中的页面序列，如为循环播放则首尾各多一页，如页面为0-1-2，则cards为2-0-1-2-0
    this.cardCount = multiPage && this.cycle ? this.pageCount + 2 : this.pageCount
    if (this.cardIndex === null || this.cardIndex >= this.cardCount)
      this.cardIndex = multiPage && this.cycle ? startIndex + 1 : startIndex

    //下一页卡片步进
    this.step = this.forward ? 1 : -1
  }

  //设置定时器，开启轮播时在interval毫秒之后滚动到下一卡片
  setupTimer () {
    this.removeTimer()
    if (!this.carousel) return
    this.timer = setTimeout(() => {
      this.timer = null
      this.scrollToNextCard()
    }, this.props.interval)
  }

  //删除定时器
  removeTimer () {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  //滚动到指定卡片
  scrollToCard (cardIndex, animated = true) {
    let { width, height } = this.state
    if (cardIndex < 0) cardIndex = 0
    else if (cardIndex >= this.cardCount) cardIndex = this.cardCount - 1
    if (this.refs.scrollView) {
      if (this.props.horizontal) {
        this.refs.scrollView.scrollTo({ x: width * cardIndex, y: 0, animated: animated })
      } else this.refs.scrollView.scrollTo({ x: 0, y: height * cardIndex, animated: animated })
    }
  }

  //滚动到下一张卡片
  scrollToNextCard (animated = true) {
    this.scrollToCard(this.cardIndex + this.step, animated)
  }

  //修改当前卡片编号
  changeCardIndex (cardIndex) {
    if (cardIndex == this.cardIndex) return
    this.cardIndex = cardIndex
    let total = this.pageCount
    let pageIndex = this.cycle ? cardIndex - 1 : cardIndex
    if (pageIndex < 0) pageIndex = total - 1
    else if (pageIndex >= total) pageIndex = 0
    this.setState({ pageIndex })
    this.props.onChange && this.props.onChange(pageIndex, total)
  }

  //横向滚动事件
  onHorizontalScroll (e) {
    let { width } = this.state
    let { x } = e.nativeEvent.contentOffset
    let cardIndex = Math.round(x / width)

    if (this.cycle) {
      if (cardIndex <= 0 && x <= 0) {
        cardIndex = this.cardCount - 2
        this.scrollToCard(cardIndex, false)
      } else if (cardIndex >= this.cardCount - 1 && x >= (this.cardCount - 1) * width) {
        cardIndex = 1
        this.scrollToCard(cardIndex, false)
      }
    }

    this.changeCardIndex(cardIndex)
    this.setupTimer()
  }

  //纵向滚动事件
  onVerticalScroll (e) {
    let { height } = this.state
    let { y } = e.nativeEvent.contentOffset
    let cardIndex = Math.round(y / height)

    if (this.cycle) {
      if (cardIndex <= 0 && y <= 0) {
        cardIndex = this.cardCount - 2
        this.scrollToCard(cardIndex, false)
      } else if (cardIndex >= this.cardCount - 1 && y >= (this.cardCount - 1) * height) {
        cardIndex = 1
        this.scrollToCard(cardIndex, false)
      }
    }

    this.changeCardIndex(cardIndex)
    this.setupTimer()
  }

  //页面滚动事件
  onScroll (e) {
    if (this.state.width == 0 || this.state.height == 0) return
    this.props.horizontal ? this.onHorizontalScroll(e) : this.onVerticalScroll(e)
    this.props.onScroll && this.props.onScroll(e)
  }

  //布局变更时修改页面宽度、高度，刷新显示
  onLayout (e) {
    //stark: 因 onLayout 回调前就 执行了 componentDidMount 的 scrollToCard 方法，故 此处 提醒 外部 传入的 width height 的类型 必须是 number，这样 onLayout 之前 执行的  scrollToCard
    // 方法 就 能 起作用
    if (typeof (this.state.width) !== 'number' || typeof (this.state.height) !== 'number') {
      alert('Carousel 的 style.width 和  style.height 必须传 number，否则 一开始 画的 就不是 第一个 图')
      console.log('Carousel onLayout width=', e.nativeEvent.layout.width)
      this.setState({
        width: e.nativeEvent.layout.width,
        height: e.nativeEvent.layout.height,
      })
    }

    this.props.onLayout && this.props.onLayout(e)
  }

  //渲染卡片列表
  renderCards () {
    let { width, height } = this.state
    let { children } = this.props
    if (width <= 0 || height <= 0 || !children) return null
    if (!(children instanceof Array)) children = [children]
    let cards = []
    let cardStyle = { width: width, height: height, overflow: 'hidden' }
    this.cycle && cards.push(
      <View style={cardStyle} key={'card-head'}>{children[children.length - 1]}</View>
    )
    children.map((item, index) => cards.push(
      <View style={cardStyle} key={'card' + index}>{item}</View>
    ))
    this.cycle && cards.push(
      <View style={cardStyle} key={'card-tail'}>{children[0]}</View>
    )
    return cards
  }

  render () {
    let { style, children, horizontal, contentContainerStyle, control, onScroll, onLayout, onChange, direction, ...others } = this.props
    let { width, height, pageIndex } = this.state
    /**
     * stark: children 是空数组时 ，外部 不要 绘制 此控件，否则 显示有问题，外部可通过 以下方式避免 数据源时 [] 时 绘制此控件
     *
     * self.state.images && self.state.images.length > 0 ?
     <Carousel
     </Carousel>
     : null
     */
    if (children.length === 0) {//
      alert('Carousel children.length = 0 时 外部不要 画 此控件，否则  有问题')
      return null
    }

    if (width > 0 && height > 0) {
      let fixStyle
      if (horizontal) fixStyle = { width: width * this.cardCount, height: height }
      else fixStyle = { width: width, height: height * this.cardCount }
      contentContainerStyle = [].concat(contentContainerStyle).concat(fixStyle)
    }
    if (React.isValidElement(control)) {
      control = React.cloneElement(control, { index: pageIndex, total: this.pageCount, carousel: this })
    } else if (control) {
      control = <this.constructor.Control index={pageIndex} total={this.pageCount} carousel={this} />
    }
    return (
      <View style={[style, { alignItems: 'stretch' }]}>
        <ScrollView
          style={{ flex: 1 }}
          horizontal={horizontal}
          contentContainerStyle={contentContainerStyle}
          {...others}
          ref='scrollView'
          onScroll={(e) => this.onScroll(e)}
          onLayout={(e) => this.onLayout(e)}
        >
          {this.renderCards()}
        </ScrollView>
        {control}
      </View>
    )
  }

}
